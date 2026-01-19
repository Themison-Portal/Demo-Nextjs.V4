/**
 * Client - Trial Team Members API Route
 * GET: List team members
 * POST: Add team member
 * PUT: Update team member role (including PI assignment)
 * DELETE: Remove team member
 */

import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";

/**
 * GET /api/client/[orgId]/trials/[trialId]/team
 * Get all team members for a trial
 * Allows: org admin OR trial team member
 */
export const GET = withTrialMember(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  const { data: allMembers, error } = await supabase
    .from("trial_team_members")
    .select(`
      id,
      trial_id,
      org_member_id,
      trial_role,
      assigned_at,
      assigned_by,
      status,
      settings,
      organization_members:org_member_id (
        id,
        deleted_at,
        user:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      )
    `)
    .eq("trial_id", trialId);

  // Filter out members whose org membership was deleted (user removed from org)
  const teamMembers = (allMembers || []).filter(
    (member: any) => member.organization_members?.deleted_at === null
  );

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
    status: member.status,
    settings: member.settings,
    user: member.organization_members?.user || null,
  }));

  return Response.json({ team_members: transformed });
});

/**
 * POST /api/client/[orgId]/trials/[trialId]/team
 * Add a new team member
 * Body: { org_member_id: string, trial_role: string }
 * Allows: org admin OR PI/CRC (but only org admin can assign PI role)
 */
export const POST = withTrialMember(async (req, ctx, user) => {
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

  // Check permissions based on role being assigned
  const perms = getTrialPermissions(user.orgRole, user.trialRole);

  if (trial_role === 'PI') {
    // Only org admin can assign PI
    if (!perms.canAssignPI) {
      return responses.forbidden("Only organization admins can assign the PI role");
    }
  } else {
    // PI/CRC can manage other team members
    if (!perms.canManageTeam) {
      return responses.forbidden("You don't have permission to manage team members");
    }
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

  // If assigning PI role, check if one already exists
  if (trial_role === "PI") {
    const { data: existingPIs } = await supabase
      .from("trial_team_members")
      .select(`
        org_member_id,
        organization_members:org_member_id(
          deleted_at,
          user:user_id(full_name, email)
        )
      `)
      .eq("trial_id", trialId)
      .eq("trial_role", "PI")
      .neq("org_member_id", org_member_id); // Exclude if reassigning same person

    // Filter to only PIs with valid org membership (deleted_at IS NULL)
    const validPI = existingPIs?.find(
      (pi: any) => pi.organization_members?.deleted_at === null
    );

    if (validPI) {
      const piUser = (validPI as any).organization_members?.user;
      const piName = piUser?.full_name || piUser?.email || "Unknown";
      return Response.json(
        {
          error: "A PI is already assigned to this trial",
          details: `${piName} is currently the PI. Please remove them first before assigning a new PI.`,
        },
        { status: 409 } // Conflict
      );
    }

    // Clean up orphaned PI memberships (user deleted from org)
    const orphanedPIs = existingPIs?.filter(
      (pi: any) => pi.organization_members?.deleted_at !== null || !pi.organization_members
    );

    if (orphanedPIs && orphanedPIs.length > 0) {
      // Hard delete orphaned memberships
      await supabase
        .from("trial_team_members")
        .delete()
        .eq("trial_id", trialId)
        .eq("trial_role", "PI")
        .in("org_member_id", orphanedPIs.map((pi: any) => pi.org_member_id));
    }
  }

  // Check if member already exists
  const { data: existingMember } = await supabase
    .from("trial_team_members")
    .select("id, trial_role")
    .eq("trial_id", trialId)
    .eq("org_member_id", org_member_id)
    .single();

  let result;

  if (existingMember) {
    // Member already exists - update their role
    const { data: updated, error: updateError } = await supabase
      .from("trial_team_members")
      .update({
        trial_role,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
      })
      .eq("trial_id", trialId)
      .eq("org_member_id", org_member_id)
      .select()
      .single();

    if (updateError) {
      console.error("[API] Error updating team member:", updateError);
      return Response.json({ error: "Failed to update team member" }, { status: 500 });
    }
    result = updated;
  } else {
    // New member - insert
    const { data: newMember, error: insertError } = await supabase
      .from("trial_team_members")
      .insert({
        trial_id: trialId,
        org_member_id,
        trial_role,
        assigned_by: user.id,
        assigned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("[API] Error adding team member:", insertError);
      return Response.json({ error: "Failed to add team member" }, { status: 500 });
    }
    result = newMember;
  }

  return Response.json(result, { status: 201 });
});

/**
 * PUT /api/client/[orgId]/trials/[trialId]/team
 * Update a team member's role, status, or settings
 * Body: { org_member_id: string, trial_role?: string, status?: string, settings?: object }
 * Allows: org admin OR PI/CRC (but only org admin can assign PI role)
 */
export const PUT = withTrialMember(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { org_member_id, trial_role, status, settings } = body;

  if (!org_member_id) {
    return Response.json(
      { error: "org_member_id is required" },
      { status: 400 }
    );
  }

  // At least one field to update is required
  if (!trial_role && !status && !settings) {
    return Response.json(
      { error: "At least one of trial_role, status, or settings must be provided" },
      { status: 400 }
    );
  }

  // Check permissions based on what's being updated
  const perms = getTrialPermissions(user.orgRole, user.trialRole);

  if (trial_role === 'PI') {
    // Only org admin can assign PI
    if (!perms.canAssignPI) {
      return responses.forbidden("Only organization admins can assign the PI role");
    }
  } else {
    // PI/CRC can manage other team members (role, status, settings)
    if (!perms.canManageTeam) {
      return responses.forbidden("You don't have permission to manage team members");
    }
  }

  // If changing to PI role, check if one already exists
  if (trial_role === "PI") {
    const { data: existingPIs } = await supabase
      .from("trial_team_members")
      .select(`
        org_member_id,
        organization_members:org_member_id(
          deleted_at,
          user:user_id(full_name, email)
        )
      `)
      .eq("trial_id", trialId)
      .eq("trial_role", "PI")
      .neq("org_member_id", org_member_id); // Exclude if same person

    // Filter to only PIs with valid org membership (deleted_at IS NULL)
    const validPI = existingPIs?.find(
      (pi: any) => pi.organization_members?.deleted_at === null
    );

    if (validPI) {
      const piUser = (validPI as any).organization_members?.user;
      const piName = piUser?.full_name || piUser?.email || "Unknown";
      return Response.json(
        {
          error: "A PI is already assigned to this trial",
          details: `${piName} is currently the PI. Please remove them first before assigning a new PI.`,
        },
        { status: 409 } // Conflict
      );
    }

    // Clean up orphaned PI memberships (user deleted from org)
    const orphanedPIs = existingPIs?.filter(
      (pi: any) => pi.organization_members?.deleted_at !== null || !pi.organization_members
    );

    if (orphanedPIs && orphanedPIs.length > 0) {
      // Hard delete orphaned memberships
      await supabase
        .from("trial_team_members")
        .delete()
        .eq("trial_id", trialId)
        .eq("trial_role", "PI")
        .in("org_member_id", orphanedPIs.map((pi: any) => pi.org_member_id));
    }
  }

  // Build update object with provided fields
  const updates: any = {};
  if (trial_role !== undefined) updates.trial_role = trial_role;
  if (status !== undefined) updates.status = status;
  if (settings !== undefined) updates.settings = settings;

  // Update the team member
  const { data: updated, error: updateError } = await supabase
    .from("trial_team_members")
    .update(updates)
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
 * Remove a team member (hard delete)
 * Query: ?org_member_id=xxx
 * Allows: org admin OR PI/CRC
 */
export const DELETE = withTrialMember(async (req, ctx, user) => {
  // Check manage team permission
  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canManageTeam) {
    return responses.forbidden("You don't have permission to manage team members");
  }

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

  // Hard delete - preserves simplicity like Trello/Linear
  // Historial is maintained via audit_logs and org member snapshots
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
