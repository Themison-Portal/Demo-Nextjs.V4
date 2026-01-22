import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import type {
  TrialActivityListResponse,
  CreateTrialActivityInput,
  TrialActivityType,
} from "@/services/activities/types";

// GET: List trial-specific activities
export const GET = withTrialMember(async (req, ctx, user) => {
  const supabase = await createClient();
  const { trialId } = ctx.params;

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canViewTrial) {
    return responses.forbidden("You don't have permission to view this trial");
  }

  const { data: activities, error } = await supabase
    .from("trial_activity_types")
    .select("*")
    .eq("trial_id", trialId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("[API] Error fetching trial activities:", error);
    return Response.json(
      { error: "Failed to fetch trial activities" },
      { status: 500 }
    );
  }

  const response: TrialActivityListResponse = {
    activities: activities || [],
    total: (activities || []).length,
  };

  return Response.json(response);
});

// POST: Create new trial-specific activity
export const POST = withTrialMember(async (req, ctx, user) => {
  const supabase = await createClient();
  const { trialId } = ctx.params;

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canEditTrial) {
    return responses.forbidden("You don't have permission to edit this trial");
  }

  const body = (await req.json()) as CreateTrialActivityInput;

  // Validate input
  if (!body.activity_id || !body.name) {
    return responses.badRequest("activity_id and name are required");
  }

  // Check if activity_id already exists in this trial
  const { data: existing } = await supabase
    .from("trial_activity_types")
    .select("id")
    .eq("trial_id", trialId)
    .eq("activity_id", body.activity_id)
    .is("deleted_at", null)
    .single();

  if (existing) {
    return responses.badRequest(
      `Activity with id "${body.activity_id}" already exists in this trial`
    );
  }

  // Create activity
  const { data: activity, error } = await supabase
    .from("trial_activity_types")
    .insert({
      trial_id: trialId,
      activity_id: body.activity_id,
      name: body.name,
      category: body.category || null,
      description: body.description || null,
      is_custom: true,
    })
    .select()
    .single();

  if (error) {
    console.error("[API] Error creating trial activity:", error);
    return Response.json(
      { error: "Failed to create trial activity" },
      { status: 500 }
    );
  }

  return Response.json(activity as TrialActivityType, { status: 201 });
});
