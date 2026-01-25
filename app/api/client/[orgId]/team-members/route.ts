/**
 * Client - Team Members API Route
 * GET: Get team members from all trials the user has access to
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgMember } from "@/lib/api/middleware";
import { isAdminRole } from "@/lib/permissions/constants";

/**
 * GET /api/client/[orgId]/team-members
 * Get unique team members from all trials user has access to
 *
 * Query params:
 * - trial_id: Optional filter by specific trial
 *
 * Access:
 * - superadmin/admin: Team members from ALL trials in org
 * - editor/reader: Team members from THEIR assigned trials
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Parse query params
  const url = new URL(req.url);
  const trialIdFilter = url.searchParams.get("trial_id");

  // Determine if user can see all trials
  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  let trialIds: string[] = [];

  if (canViewAll) {
    // Admin: Get all trials in org
    const { data: trials, error: trialsError } = await supabase
      .from("trials")
      .select("id")
      .eq("org_id", orgId)
      .is("deleted_at", null);

    if (trialsError) {
      console.error("[API] Error fetching trials:", trialsError);
      return Response.json(
        { error: "Failed to fetch trials" },
        { status: 500 }
      );
    }

    trialIds = (trials || []).map((t) => t.id);
  } else {
    // Non-admin: Get user's assigned trials
    const { data: userTrials, error: userTrialsError } = await supabase
      .from("trial_team_members")
      .select("trial_id")
      .eq("org_member_id", user.orgMemberId);

    if (userTrialsError) {
      console.error("[API] Error fetching user trials:", userTrialsError);
      return Response.json(
        { error: "Failed to fetch user trials" },
        { status: 500 }
      );
    }

    trialIds = (userTrials || []).map((t) => t.trial_id);
  }

  // Apply trial filter if provided
  if (trialIdFilter) {
    trialIds = trialIds.filter((id) => id === trialIdFilter);
  }

  if (trialIds.length === 0) {
    return Response.json({ team_members: [] });
  }

  // Get team members from these trials
  const { data: teamMembers, error: teamError } = await supabase
    .from("trial_team_members")
    .select(
      `
      id,
      trial_id,
      trial_role,
      organization_members!inner (
        user:user_id (
          id,
          email,
          full_name
        )
      ),
      trials!inner (
        id,
        name
      )
    `
    )
    .in("trial_id", trialIds)
    .is("organization_members.deleted_at", null);

  if (teamError) {
    console.error("[API] Error fetching team members:", teamError);
    return Response.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }

  // Transform and deduplicate by user_id
  const memberMap = new Map();

  (teamMembers || []).forEach((member: any) => {
    const userId = member.organization_members?.user?.id;
    if (!userId) return;

    if (!memberMap.has(userId)) {
      memberMap.set(userId, {
        user_id: userId,
        email: member.organization_members.user.email,
        full_name: member.organization_members.user.full_name,
        trial_role: member.trial_role,
        trial_id: member.trial_id,
        trial_name: member.trials?.name,
        // Track all trials this user is in
        trials: [
          {
            trial_id: member.trial_id,
            trial_name: member.trials?.name,
            trial_role: member.trial_role,
          },
        ],
      });
    } else {
      // Add this trial to the user's trial list
      const existing = memberMap.get(userId);
      existing.trials.push({
        trial_id: member.trial_id,
        trial_name: member.trials?.name,
        trial_role: member.trial_role,
      });
    }
  });

  const uniqueMembers = Array.from(memberMap.values());

  return Response.json({ team_members: uniqueMembers });
});
