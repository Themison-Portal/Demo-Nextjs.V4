/**
 * withOrgMember Middleware
 * Allows any active member of the organization (or staff) to access endpoints.
 * Delegates all auth/role checks to the backend via /me.
 */

import { withAuth } from "./withAuth";
import { AuthHandler, responses } from "./types";
import type { AuthUser } from "../../auth/getUser";


export interface OrgMemberUser extends AuthUser {
    orgMemberId?: string;
    orgRole: string;
    organizationId?: string;
    organizationName?: string;
}

export type OrgMemberHandler = (
    req: Request,
    ctx: { params: Record<string, string> },
    user: OrgMemberUser
) => Promise<Response>;

/**
 * Wraps a route handler with organization member check
 * Checks:
 * - Staff → access allowed
 * - Member → must belong to the requested organization
 * Uses backend /me endpoint for all info
 */
export function withOrgMember(handler: OrgMemberHandler) {
    return withAuth(async (req, ctx, user) => {
        const { orgId } = ctx.params;

        if (!orgId) {
            return responses.badRequest("Organization ID required");
        }

        // The backend /me endpoint already returns:
        // user.member.id, user.role, user.organizationId, user.organizationName
        if (user.isStaff) {
            // Staff has implicit superadmin access
            return handler(req, ctx, {
                ...user,
                orgMemberId: "staff",
                orgRole: "superadmin",
                organizationId: user.organizationId,
                organizationName: user.organizationName,
            });
        }

        // Member access: ensure user belongs to the requested org
        if (user.organizationId !== orgId) {
            return responses.forbidden("Not a member of this organization");
        }

        return handler(req, ctx, {
            ...user,
            orgMemberId: user.memberId,
            orgRole: user.role!,
            organizationId: user.organizationId,
            organizationName: user.organizationName,
        });
    });
}