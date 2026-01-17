/**
 * Client - Organization API Route
 * GET: Get organization with members (org admin or staff with support)
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgPermission } from "@/lib/api/middleware";

/**
 * GET /api/client/[orgId]/organization
 * Get organization details with members
 * Allows: superadmin, admin of org, or staff with support_enabled
 */
export const GET = withOrgPermission(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

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

  // Fetch pending invitations
  const { data: invitations, error: invitationsError } = await supabase
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

  return Response.json({
    ...organization,
    members: members || [],
    invitations: invitations || [],
  });
});
