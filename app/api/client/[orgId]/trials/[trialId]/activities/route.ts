import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import type { ActivityListResponse } from "@/services/activities/types";

// GET: Listar activity types disponibles
export const GET = withTrialMember(async (req, ctx, user) => {
  const supabase = await createClient();

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canViewTrial) {
    return responses.forbidden("No tienes permiso para ver este trial");
  }

  // Get query params for filtering
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  let query = supabase
    .from("activity_types")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  // Filter by category if provided
  if (category) {
    query = query.eq("category", category);
  }

  const { data: activities, error } = await query;

  if (error) {
    console.error("[API] Error fetching activity types:", error);
    return Response.json({ error: "Failed to fetch activity types" }, { status: 500 });
  }

  const response: ActivityListResponse = {
    activities: activities || [],
    total: (activities || []).length,
  };

  return Response.json(response);
});
