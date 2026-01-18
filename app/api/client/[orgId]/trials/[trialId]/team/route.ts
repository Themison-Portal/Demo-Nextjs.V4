/**
 * Client - Trial Team Members API Route
 * GET: List team members
 * POST: Add team member
 * PUT: Update team member role (including PI assignment)
 * DELETE: Remove team member
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgPermission } from "@/lib/api/middleware";

/**
 * GET /api/client/[orgId]/trials/[trialId]/team
 * Get all team members for a trial
 */
export const GET = withOrgPermission(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  const { data: teamMembers, error } = await supabase
    .from("trial_team_members")
    .select(`
      id,
      trial_id,
      org_member_id,
      trial_role,
      assigned_at,
      assigned_by,
      organization_members:org_member_id (
        id,
        user:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      )
    `)
    .eq("trial_id", trialId);

  if (error) {
    console.error("[API] Error fetching team members:", error);
    return Response.json({ error: "Failed to fetch team members" }, { status: 500 });
  }

  // Transform to flatten user data
  const transformed = (teamMembers || []).map((member: any) => ({
    id: member.id,
    trial_id: member.trial_id,
    org_member_id: member.org_member_id,
    trial_role: member.trial_role,
    assigned_at: member.assigned_at,
    assigned_by: member.assigned_by,
    user: member.organization_members?.user || null,
  }));

  return Response.json({ team_members: transformed });
});

/**
 * POST /api/client/[orgId]/trials/[trialId]/team
 * Add a new team member
 * Body: { org_member_id: string, trial_role: string }
 */
export const POST = withOrgPermission(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { org_member_id, trial_role } = body;

  if (!org_member_id || !trial_role) {
    return Response.json(
      { error: "org_member_id and trial_role are required" },
      { status: 400 }
    );
  }

  // Verify org_member belongs to this organization
  const { data: orgMember, error: orgMemberError } = await supabase
    .from("organization_members")
    .select("id, org_id")
    .eq("id", org_member_id)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .single();

  if (orgMemberError || !orgMember) {
    return Response.json(
      { error: "Organization member not found" },
      { status: 404 }
    );
  }

  // Verify trial belongs to org
  const { data: trial, error: trialError } = await supabase
    .from("trials")
    .select("id")
    .eq("id", trialId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .single();

  if (trialError || !trial) {
    return Response.json({ error: "Trial not found" }, { status: 404 });
  }

  // If assigning PI role, remove existing PI first (only one PI allowed)
  if (trial_role === "PI") {
    await supabase
      .from("trial_team_members")
      .delete()
      .eq("trial_id", trialId)
      .eq("trial_role", "PI");
  }

  // Insert new team member (upsert to handle existing member role change)
  const { data: newMember, error: insertError } = await supabase
    .from("trial_team_members")
    .upsert(
      {
        trial_id: trialId,
        org_member_id,
        trial_role,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
      },
      {
        onConflict: "trial_id,org_member_id",
      }
    )
    .select()
    .single();

  if (insertError) {
    console.error("[API] Error adding team member:", insertError);
    return Response.json({ error: "Failed to add team member" }, { status: 500 });
  }

  return Response.json(newMember, { status: 201 });
});

/**
 * PUT /api/client/[orgId]/trials/[trialId]/team
 * Update a team member's role
 * Body: { org_member_id: string, trial_role: string }
 */
export const PUT = withOrgPermission(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { org_member_id, trial_role } = body;

  if (!org_member_id || !trial_role) {
    return Response.json(
      { error: "org_member_id and trial_role are required" },
      { status: 400 }
    );
  }

  // If changing to PI role, remove existing PI first
  if (trial_role === "PI") {
    await supabase
      .from("trial_team_members")
      .update({ trial_role: "Team Member" })
      .eq("trial_id", trialId)
      .eq("trial_role", "PI");
  }

  // Update the role
  const { data: updated, error: updateError } = await supabase
    .from("trial_team_members")
    .update({ trial_role })
    .eq("trial_id", trialId)
    .eq("org_member_id", org_member_id)
    .select()
    .single();

  if (updateError) {
    console.error("[API] Error updating team member:", updateError);
    return Response.json({ error: "Failed to update team member" }, { status: 500 });
  }

  return Response.json(updated);
});

/**
 * DELETE /api/client/[orgId]/trials/[trialId]/team
 * Remove a team member
 * Query: ?org_member_id=xxx
 */
export const DELETE = withOrgPermission(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  const url = new URL(req.url);
  const org_member_id = url.searchParams.get("org_member_id");

  if (!org_member_id) {
    return Response.json(
      { error: "org_member_id query param is required" },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabase
    .from("trial_team_members")
    .delete()
    .eq("trial_id", trialId)
    .eq("org_member_id", org_member_id);

  if (deleteError) {
    console.error("[API] Error removing team member:", deleteError);
    return Response.json({ error: "Failed to remove team member" }, { status: 500 });
  }

  return Response.json({ success: true });
});
