/**
 * Client - Current User Membership API Route
 * GET: Get current user's membership in the organization
 * Lightweight endpoint for permission checks
 */

import { withOrgMember } from "@/lib/api/middleware";

/**
 * GET /api/client/[orgId]/me
 * Get current user's membership details (role, status)
 * Returns: { orgMemberId, orgRole, isStaff }
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  return Response.json({
    userId: user.id,
    email: user.email,
    orgMemberId: user.orgMemberId,
    orgRole: user.orgRole,
    isStaff: user.isStaff,
  });
});
