/**
 * withStaffPermission Middleware
 * Staff-only permission check for console operations
 * Delegates auth to backend (Auth0 + role-based access)
 */

import { withAuth } from "./withAuth";
import { AuthHandler, responses } from "./types";

/**
 * Wraps a route handler with staff permission check.
 * Allows only staff users (backend guarantees role validity).
 *
 * Use this for /console operations like:
 * - Listing organizations
 * - Creating organizations
 * - Toggling support mode
 *
 * @example
 * export const GET = withStaffPermission(async (req, ctx, user) => {
 *   return Response.json({ organizations: [] });
 * });
 */
export function withStaffPermission(handler: AuthHandler) {
    return withAuth(async (req, ctx, user) => {
        // Staff-only access (backend determines role)
        if (!user.isStaff) {
            return responses.forbidden("Staff access required");
        }

        return handler(req, ctx, user);
    });
}