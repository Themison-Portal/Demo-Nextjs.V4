/**
 * withOrgPermission Middleware
 * Organization-scope permission check
 * User must be superadmin, admin, or staff with support enabled
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withAuth } from "./withAuth";
import { AuthHandler, RouteContext, responses } from "./types";

/**
 * Wraps a route handler with organization permission check
 * Allows: superadmin, admin, staff (if support_enabled)
 *
 * @example
 * export const POST = withOrgPermission(async (req, ctx, user) => {
 *   const { orgId } = ctx.params;
 *   // User has org-level permissions
 *   // Create trial, invite members, etc.
 * });
 */
export function withOrgPermission(handler: AuthHandler) {
  return withAuth(async (req, ctx, user) => {
    const { orgId } = ctx.params;

    if (!orgId) {
      return responses.badRequest("Organization ID required");
    }

    const supabase = await createClient();

    // CASE 1: Staff with support enabled
    if (user.isStaff) {
      const { data: org } = await supabase
        .from("organizations")
        .select("support_enabled")
        .eq("id", orgId)
        .single();

      if (!org) {
        return responses.notFound("Organization not found");
      }

      if (!org.support_enabled) {
        return responses.forbidden("Support access not enabled for this organization");
      }

      // Staff + support enabled → allowed
      return handler(req, ctx, user);
    }

    // CASE 2: Organization member (must be superadmin or admin)
    const { data: member } = await supabase
      .from("organization_members")
      .select("org_role, status")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .single();

    if (!member) {
      return responses.forbidden("Not a member of this organization");
    }

    if (member.status !== "active") {
      return responses.forbidden("Membership is not active");
    }

    if (!["superadmin", "admin"].includes(member.org_role)) {
      return responses.forbidden("Requires superadmin or admin role");
    }

    // Superadmin or Admin → allowed
    return handler(req, ctx, user);
  });
}
