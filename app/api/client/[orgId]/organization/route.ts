/**
 * Client - Organization API Route
 * GET: Get organization with members (any org member)
 * PATCH: Update organization (admin only)
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgMember, responses } from "@/lib/api/middleware";
import { isAdminRole } from "@/lib/permissions/constants";

/**
 * GET /api/client/[orgId]/organization
 * Get organization details with members
 * Allows: any active org member
 * Note: pending invitations only visible to admin
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();
  const canSeeInvitations = isAdminRole(user.orgRole);

  // Fetch organization
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .is("deleted_at", null)
    .single();

  if (orgError || !organization) {
    console.error("[API] Error fetching organization:", orgError);
    return Response.json({ error: "Organization not found" }, { status: 404 });
  }

  // Fetch members with user data
  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      user_id,
      org_id,
      org_role,
      status,
      joined_at,
      deleted_at,
      user:users (
        email,
        first_name,
        last_name,
        full_name,
        avatar_url
      )
    `
    )
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("[API] Error fetching members:", membersError);
    return Response.json(
      { error: "Failed to fetch organization members" },
      { status: 500 }
    );
  }

  // Fetch pending invitations (admin only)
  let invitations: any[] = [];
  if (canSeeInvitations) {
    const { data: invitationsData, error: invitationsError } = await supabase
      .from("invitations")
      .select("*")
      .eq("org_id", orgId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (invitationsError) {
      console.error("[API] Error fetching invitations:", invitationsError);
      return Response.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }
    invitations = invitationsData || [];
  }

  return Response.json({
    ...organization,
    members: members || [],
    invitations,
  });
});

/**
 * PATCH /api/client/[orgId]/organization
 * Update organization details
 * Allows: org admin only
 * Body: { name?: string, settings?: object }
 */
export const PATCH = withOrgMember(async (req, ctx, user) => {
  // Check admin permission
  if (!isAdminRole(user.orgRole)) {
    return responses.forbidden("Only organization admins can update organization settings");
  }

  const { orgId } = ctx.params;
  const supabase = await createClient();

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, settings } = body;

  // Build update object
  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (settings !== undefined) {
    // Merge with existing settings
    const { data: currentOrg } = await supabase
      .from("organizations")
      .select("settings")
      .eq("id", orgId)
      .single();

    updates.settings = {
      ...(currentOrg?.settings || {}),
      ...settings,
    };
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "At least one field to update is required" },
      { status: 400 }
    );
  }

  // Update organization
  const { data: updated, error: updateError } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId)
    .select()
    .single();

  if (updateError) {
    console.error("[API] Error updating organization:", updateError);
    return Response.json(
      { error: "Failed to update organization" },
      { status: 500 }
    );
  }

  return Response.json(updated);
});
