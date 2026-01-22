import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import type { ActivityMetadata } from "@/services/activities/types";

// GET: Get combined metadata (global + trial-specific)
export const GET = withTrialMember(async (req, ctx, user) => {
  const supabase = await createClient();
  const { trialId } = ctx.params;

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canViewTrial) {
    return responses.forbidden("You don't have permission to view this trial");
  }

  // Get global activities
  const { data: globalActivities, error: globalError } = await supabase
    .from("activity_types")
    .select("id, name, category, description")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (globalError) {
    console.error("[API] Error fetching global activities:", globalError);
    return Response.json(
      { error: "Failed to fetch global activities" },
      { status: 500 }
    );
  }

  // Get trial-specific activities
  const { data: trialActivities, error: trialError } = await supabase
    .from("trial_activity_types")
    .select("activity_id, name, category, description, is_custom")
    .eq("trial_id", trialId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (trialError) {
    console.error("[API] Error fetching trial activities:", trialError);
    return Response.json(
      { error: "Failed to fetch trial activities" },
      { status: 500 }
    );
  }

  // Combine and deduplicate (trial-specific overrides global)
  const activityMap = new Map<string, ActivityMetadata>();

  // First add global activities
  (globalActivities || []).forEach((activity) => {
    activityMap.set(activity.id, {
      activity_id: activity.id,
      name: activity.name,
      category: activity.category,
      description: activity.description,
      source: "global",
    });
  });

  // Then add/override with trial-specific activities
  (trialActivities || []).forEach((activity) => {
    activityMap.set(activity.activity_id, {
      activity_id: activity.activity_id,
      name: activity.name,
      category: activity.category,
      description: activity.description,
      source: "trial",
      is_custom: activity.is_custom,
    });
  });

  const activities = Array.from(activityMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return Response.json({
    activities,
    total: activities.length,
  });
});
