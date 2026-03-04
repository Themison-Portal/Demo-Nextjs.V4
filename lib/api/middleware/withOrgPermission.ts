/**
 * withOrgPermission Middleware
 * Organization-scope permission check
 * Delegates all auth checks to FastAPI backend.
 * User must be superadmin, admin, or staff allowed by backend.
 */

import { NextRequest } from "next/server";
import { withAuth } from "./withAuth";
import { AuthHandler, responses } from "./types";

/**
 * Wraps a route handler with organization permission check
 * Delegates validation to backend (Auth0 + role-based access)
 *
 * @example
 * export const POST = withOrgPermission(async (req, ctx, user) => {
 *   const { orgId } = ctx.params;
 *   // Backend ensures user has org-level permissions
 * });
 */
export function withOrgPermission(handler: AuthHandler) {
    return withAuth(async (req, ctx, user) => {
        const { orgId } = ctx.params;

        if (!orgId) {
            return responses.badRequest("Organization ID required");
        }

        // All auth decisions (role, membership, org access) happen in backend
        // Frontend trusts the backend and does not check support_enabled
        return handler(req, ctx, user);
    });
}