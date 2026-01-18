/**
 * API Middleware
 * Permission middleware for API route handlers
 */

/**
 * API Middleware Exports
 *
 * Middleware hierarchy:
 * - withAuth: Base authentication (user must be logged in)
 * - withStaffPermission: Staff only (@themison.com)
 * - withOrgMember: Any active org member (for org-level reads)
 * - withOrgPermission: Admin+ only (for org-level writes: create trial, invite, etc.)
 * - withTrialMember: Org admin OR trial team member (for trial-level access)
 *
 * For trial actions, use withTrialMember + getTrialPermissions() for granular control.
 */

export { withAuth } from "./withAuth";
export { withStaffPermission } from "./withStaffPermission";
export { withOrgMember } from "./withOrgMember";
export { withOrgPermission } from "./withOrgPermission";
export { withTrialMember } from "./withTrialMember";
export { responses } from "./types";
export type { AuthHandler, RouteContext } from "./types";
export type { OrgMemberUser, OrgMemberHandler } from "./withOrgMember";
export type { TrialMemberUser, TrialMemberHandler } from "./withTrialMember";
