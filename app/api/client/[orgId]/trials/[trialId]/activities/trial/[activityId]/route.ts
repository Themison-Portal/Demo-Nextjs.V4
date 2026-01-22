import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import type {
  UpdateTrialActivityInput,
  TrialActivityType,
} from "@/services/activities/types";

// PATCH: Update trial-specific activity
export const PATCH = withTrialMember(async (req, ctx, user) => {
  const supabase = await createClient();
  const { trialId, activityId } = ctx.params;

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canEditTrial) {
    return responses.forbidden("You don't have permission to edit this trial");
  }

  const body = (await req.json()) as UpdateTrialActivityInput;

  // Update activity
  const { data: activity, error } = await supabase
    .from("trial_activity_types")
    .update({
      name: body.name,
      category: body.category,
      description: body.description,
      updated_at: new Date().toISOString(),
    })
    .eq("trial_id", trialId)
    .eq("activity_id", activityId)
    .is("deleted_at", null)
    .select()
    .single();

  if (error) {
    console.error("[API] Error updating trial activity:", error);
    return Response.json(
      { error: "Failed to update trial activity" },
      { status: 500 }
    );
  }

  if (!activity) {
    return responses.notFound("Activity not found");
  }

  return Response.json(activity as TrialActivityType);
});

// DELETE: Soft delete trial-specific activity
export const DELETE = withTrialMember(async (req, ctx, user) => {
  const supabase = await createClient();
  const { trialId, activityId } = ctx.params;

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canEditTrial) {
    return responses.forbidden("You don't have permission to edit this trial");
  }

  // Soft delete
  const { error } = await supabase
    .from("trial_activity_types")
    .update({ deleted_at: new Date().toISOString() })
    .eq("trial_id", trialId)
    .eq("activity_id", activityId)
    .is("deleted_at", null);

  if (error) {
    console.error("[API] Error deleting trial activity:", error);
    return Response.json(
      { error: "Failed to delete trial activity" },
      { status: 500 }
    );
  }

  return Response.json({ success: true });
});
