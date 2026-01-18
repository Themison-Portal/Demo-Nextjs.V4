/**
 * withOrgMember Middleware
 * Allows any ACTIVE member of the organization (regardless of role)
 * Use this for endpoints that any org member should access
 */

import { createClient } from "@/lib/supabase/server";
import { withAuth } from "./withAuth";
import { AuthHandler, responses } from "./types";
import type { OrgRole } from "@/lib/permissions/constants";

export interface OrgMemberUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isStaff: boolean;
  orgMemberId: string;
  orgRole: OrgRole;
}

export type OrgMemberHandler = (
  req: Request,
  ctx: { params: Record<string, string> },
  user: OrgMemberUser
) => Promise<Response>;

/**
 * Wraps a route handler with organization member check
 * Allows: ANY active member of the org, or staff (if support_enabled)
 * Adds orgRole and orgMemberId to user object
 */
export function withOrgMember(handler: OrgMemberHandler) {
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

      // Staff has implicit superadmin access
      return handler(req, ctx, {
        ...user,
        orgMemberId: "staff",
        orgRole: "superadmin" as OrgRole,
      });
    }

    // CASE 2: Organization member (any active member)
    const { data: member } = await supabase
      .from("organization_members")
      .select("id, org_role, status")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .single();

    if (!member) {
      return responses.forbidden("Not a member of this organization");
    }

    if (member.status !== "active") {
      return responses.forbidden("Membership is not active");
    }

    // Any active member → allowed
    return handler(req, ctx, {
      ...user,
      orgMemberId: member.id,
      orgRole: member.org_role as OrgRole,
    });
  });
}
