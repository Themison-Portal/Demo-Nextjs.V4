/**
 * Client - Organization Members API Route
 * POST: Invite member to organization (org admin or staff with support)
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withOrgPermission } from "@/lib/api/middleware";
import { sendInvitationEmail } from "@/lib/email/sendInvitationEmail";
import { getInvitationUrl } from "@/lib/constants";
import { ORG_ROLES } from "@/lib/permissions/constants";

/**
 * POST /api/client/[orgId]/organization/members
 * Create invitation for new member
 * Allows: superadmin, admin of org, or staff with support_enabled
 */
export const POST = withOrgPermission(async (req: NextRequest, ctx, user) => {
  const { orgId } = ctx.params;
  const body = await req.json();
  const { email, org_role } = body;

  // Validate required fields
  if (!email || !org_role) {
    return Response.json(
      { error: "Missing required fields: email, org_role" },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Response.json({ error: "Invalid email format" }, { status: 400 });
  }

  // Validate org_role
  if (!ORG_ROLES.includes(org_role)) {
    return Response.json(
      {
        error: `Invalid org_role. Must be one of: ${ORG_ROLES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Verify organization exists
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name")
    .eq("id", orgId)
    .is("deleted_at", null)
    .single();

  if (orgError || !org) {
    return Response.json({ error: "Organization not found" }, { status: 404 });
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .single();

  if (existingUser) {
    return Response.json(
      { error: "User with this email already exists. Cannot send invitation." },
      { status: 409 }
    );
  }

  // Check if there's a pending invitation for this email in this org
  const { data: existingInvitation } = await supabase
    .from("invitations")
    .select("id, status")
    .eq("email", email)
    .eq("org_id", orgId)
    .eq("status", "pending")
    .single();

  if (existingInvitation) {
    return Response.json(
      {
        error:
          "There is already a pending invitation for this email in this organization",
      },
      { status: 409 }
    );
  }

  // Create invitation
  const { data: invitation, error: invitationError } = await supabase
    .from("invitations")
    .insert({
      email,
      org_id: orgId,
      org_role,
      invited_by: user.id,
      status: "pending",
    })
    .select()
    .single();

  if (invitationError || !invitation) {
    console.error("[API] Error creating invitation:", invitationError);
    return Response.json(
      { error: "Failed to create invitation" },
      { status: 500 }
    );
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    action: "invitation.create",
    user_id: user.id,
    org_id: orgId,
    resource_type: "invitation",
    resource_id: invitation.id,
    after: {
      email,
      org_role,
      org_id: orgId,
      invited_by: user.id,
    },
  });

  // Send invitation email
  const invitationUrl = getInvitationUrl(invitation.token);
  console.log(`[API] Invitation link for ${email}: ${invitationUrl}`);

  await sendInvitationEmail({
    to: email,
    organizationName: org.name,
    invitationUrl,
  });

  return Response.json(
    {
      message: "Invitation created successfully",
      invitation: {
        id: invitation.id,
        email: invitation.email,
        org_role: invitation.org_role,
        status: invitation.status,
        token: invitation.token,
      },
    },
    { status: 201 }
  );
});
