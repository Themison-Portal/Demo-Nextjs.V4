/**
 * Organization Member API Route
 * DELETE: Remove member from organization (staff only)
 */

import { createClient } from "@/lib/supabase/server";
import { withStaffPermission } from "@/lib/api/middleware";

/**
 * DELETE /api/organizations/[id]/members/[userId]
 * Remove member from organization (soft delete)
 */
export const DELETE = withStaffPermission(async (req, ctx, user) => {
  const { id: orgId, userId } = await ctx.params;
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

  // Verify member exists
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("user_id, org_id, org_role, user:users(email)")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (memberError || !member) {
    return Response.json(
      { error: "Member not found in this organization" },
      { status: 404 }
    );
  }

  // Check if this is the last superadmin
  if (member.org_role === "superadmin") {
    const { data: superadmins, error: superadminError } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("org_role", "superadmin")
      .is("deleted_at", null);

    if (superadminError) {
      console.error("[API] Error checking superadmins:", superadminError);
      return Response.json(
        { error: "Failed to verify superadmin status" },
        { status: 500 }
      );
    }

    if (superadmins && superadmins.length <= 1) {
      return Response.json(
        { error: "Cannot remove the last superadmin from the organization" },
        { status: 400 }
      );
    }
  }

  // Soft delete member
  const { error: deleteError } = await supabase
    .from("organization_members")
    .update({ deleted_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("user_id", userId);

  if (deleteError) {
    console.error("[API] Error removing member:", deleteError);
    return Response.json({ error: "Failed to remove member" }, { status: 500 });
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    action: "organization_member.remove",
    user_id: user.id,
    org_id: orgId,
    resource_type: "organization_member",
    resource_id: userId,
    before: {
      org_id: orgId,
      user_id: userId,
      org_role: member.org_role,
      email: member.user?.email,
    },
  });

  return Response.json({ message: "Member removed successfully" });
});
