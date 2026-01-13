/**
 * withStaffPermission Middleware
 * Staff-only permission check for console operations
 * User must be a staff member
 */

import { withAuth } from "./withAuth";
import { AuthHandler, responses } from "./types";

/**
 * Wraps a route handler with staff permission check
 * Allows only: staff members (@themison.com)
 *
 * Use this for /console operations like:
 * - Listing all organizations
 * - Creating organizations
 * - Toggling support mode
 *
 * @example
 * export const GET = withStaffPermission(async (req, ctx, user) => {
 *   // User is staff, can list all orgs
 *   return Response.json({ organizations: [] });
 * });
 */
export function withStaffPermission(handler: AuthHandler) {
  return withAuth(async (req, ctx, user) => {
    // Check if user is staff
    if (!user.isStaff) {
      return responses.forbidden("Staff access required");
    }

    // Staff member → allowed
    return handler(req, ctx, user);
  });
}
