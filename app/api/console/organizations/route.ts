/**
 * Organizations API Route
 * GET: List all organizations (staff only)
 * POST: Create new organization (staff only)
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withStaffPermission } from "@/lib/api/middleware";
import { sendInvitationEmail } from "@/lib/email/sendInvitationEmail";
import { getInvitationUrl } from "@/lib/constants";

/**
 * GET /api/organizations
 * List all organizations
 */
export const GET = withStaffPermission(async (req, ctx, user) => {
  const supabase = await createClient();

  // Fetch organizations from database (RLS allows staff to see all)
  const { data: organizations, error } = await supabase
    .from("organizations")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API] Error fetching organizations:", error);
    return Response.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }

  // Fetch member counts for each organization
  if (organizations && organizations.length > 0) {
    const orgIds = organizations.map((org) => org.id);

    // Count members (non-deleted)
    const { data: memberCounts } = await supabase
      .from("organization_members")
      .select("org_id")
      .in("org_id", orgIds)
      .is("deleted_at", null);

    // Count pending invitations
    const { data: invitationCounts } = await supabase
      .from("invitations")
      .select("org_id")
      .in("org_id", orgIds)
      .eq("status", "pending");

    // Build count maps
    const memberCountMap = new Map<string, number>();
    const invitationCountMap = new Map<string, number>();

    memberCounts?.forEach((m) => {
      memberCountMap.set(m.org_id, (memberCountMap.get(m.org_id) || 0) + 1);
    });

    invitationCounts?.forEach((i) => {
      invitationCountMap.set(
        i.org_id,
        (invitationCountMap.get(i.org_id) || 0) + 1
      );
    });

    // Add counts to organizations
    organizations.forEach((org) => {
      const memberCount = memberCountMap.get(org.id) || 0;
      const invitationCount = invitationCountMap.get(org.id) || 0;
      org.member_count = memberCount + invitationCount;
    });
  }

  return Response.json({
    organizations: organizations || [],
    total: organizations?.length || 0,
  });
});

/**
 * POST /api/organizations
 * Create new organization
 */
export const POST = withStaffPermission(async (req: NextRequest, ctx, user) => {
  const body = await req.json();
  const {
    name,
    primary_owner_email,
    additional_owner_emails = [],
    features_enabled = [],
    support_enabled = false,
  } = body;

  // Validate required fields
  if (!name || !primary_owner_email) {
    return Response.json(
      { error: "Missing required fields: name, primary_owner_email" },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(primary_owner_email)) {
    return Response.json(
      { error: "Invalid primary owner email" },
      { status: 400 }
    );
  }

  // Validate additional emails
  for (const email of additional_owner_emails) {
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: `Invalid additional owner email: ${email}` },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  // Create organization (RLS allows staff to insert)
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name,
      slug,
      support_enabled,
      settings: {
        features_enabled:
          features_enabled.length > 0 ? features_enabled : ["all"],
      },
    })
    .select()
    .single();

  if (orgError) {
    console.error("[API] Error creating organization:", orgError);
    return Response.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }

  // Create invitations for primary and additional owners
  const allOwnerEmails = [primary_owner_email, ...additional_owner_emails];
  const invitations = allOwnerEmails.map((email) => ({
    email,
    org_id: organization.id,
    org_role: "superadmin",
    invited_by: user.id,
    status: "pending",
  }));

  const { data: createdInvitations, error: invitationsError } = await supabase
    .from("invitations")
    .insert(invitations)
    .select("id, email, token");

  if (invitationsError) {
    console.error("[API] Error creating invitations:", invitationsError);
    // Don't fail the whole request, org is already created
    // But log it so we know something went wrong
  }

  // Send invitation emails
  if (createdInvitations) {
    // Send emails in parallel with Promise.all
    await Promise.all(
      createdInvitations.map(async (inv) => {
        const invitationUrl = getInvitationUrl(inv.token);
        console.log(`[API] Invitation link for ${inv.email}: ${invitationUrl}`);

        await sendInvitationEmail({
          to: inv.email,
          organizationName: organization.name,
          invitationUrl,
        });
      })
    );
  }

  return Response.json(organization, { status: 201 });
});
