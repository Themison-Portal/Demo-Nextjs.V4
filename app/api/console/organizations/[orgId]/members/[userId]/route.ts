/**
 * Console - Organization Member API Route
 * DELETE: Remove member from organization (staff only)
 *
 * Flow:
 * 1. Save user snapshot to organization_members
 * 2. Soft delete organization_members (deleted_at)
 * 3. Hard delete from auth.users (cascades to public.users)
 * 4. organization_members.user_id becomes NULL (ON DELETE SET NULL)
 *
 * Result: User is completely removed from the system, but org membership
 * record remains with snapshot for audit trail. If re-invited, they get
 * a brand new user ID with zero connection to past data.
 */

import { supabaseAdmin } from "@/lib/supabase/admin";
import { withStaffPermission } from "@/lib/api/middleware";

/**
 * DELETE /api/console/organizations/[orgId]/members/[userId]
 * Remove member from organization completely
 * Staff only - no support_enabled restriction
 */
export const DELETE = withStaffPermission(async (req, ctx, user) => {
  const { orgId, userId } = ctx.params;
  // Use admin client to bypass RLS (staff permission already verified by middleware)
  const supabase = supabaseAdmin;

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

  // Get member with full user data for snapshot
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select(
      `
      id,
      user_id,
      org_id,
      org_role,
      status,
      joined_at,
      user:users(id, email, first_name, last_name, avatar_url, created_at)
    `
    )
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .is("deleted_at", null)
    .single();

  if (memberError || !member) {
    console.error("[API DELETE] Error finding member:", memberError);
    return Response.json(
      { error: "Member not found in this organization" },
      { status: 404 }
    );
  }

  // Supabase returns user as array even with single relation
  const userArray = member.user as any;
  const userData = (Array.isArray(userArray) ? userArray[0] : userArray) as {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    created_at: string;
  } | null;

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

  // STEP 1: Save snapshot and soft delete organization_members
  const userSnapshot = userData
    ? {
        original_user_id: userData.id,
        email: userData.email,
        first_name: userData.first_name,
        last_name: userData.last_name,
        avatar_url: userData.avatar_url,
        user_created_at: userData.created_at,
        removed_at: new Date().toISOString(),
        removed_by: user.id,
      }
    : null;

  const { error: updateError } = await supabase
    .from("organization_members")
    .update({
      deleted_at: new Date().toISOString(),
      user_snapshot: userSnapshot,
    })
    .eq("id", member.id);

  if (updateError) {
    console.error("[API] Error updating member:", updateError);
    return Response.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }

  // STEP 2: Hard delete from auth.users (cascades to public.users)
  // This will SET NULL on organization_members.user_id
  const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
    userId
  );

  if (authDeleteError) {
    console.error("[API] Error deleting auth user:", authDeleteError);
    // Rollback the soft delete since auth delete failed
    await supabase
      .from("organization_members")
      .update({ deleted_at: null, user_snapshot: null })
      .eq("id", member.id);

    return Response.json(
      { error: "Failed to remove user from system" },
      { status: 500 }
    );
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    action: "organization_member.remove",
    user_id: user.id,
    org_id: orgId,
    resource_type: "organization_member",
    resource_id: member.id,
    before: {
      org_id: orgId,
      user_id: userId,
      org_role: member.org_role,
      email: userData?.email,
      first_name: userData?.first_name,
      last_name: userData?.last_name,
    },
    after: {
      deleted_at: new Date().toISOString(),
      user_snapshot: userSnapshot,
      auth_user_deleted: true,
    },
  });

  return Response.json({
    message: "Member removed successfully",
    details: {
      email: userData?.email,
      removed_from_auth: true,
      snapshot_preserved: true,
    },
  });
});
