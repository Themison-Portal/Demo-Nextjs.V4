/**
 * API Middleware
 * Permission middleware for API route handlers
 */

export { withAuth } from "./withAuth";
export { withStaffPermission } from "./withStaffPermission";
export { withOrgPermission } from "./withOrgPermission";
export { withTrialPermission } from "./withTrialPermission";
export { withCriticalPermission } from "./withCriticalPermission";
export { responses } from "./types";
export type { AuthHandler, RouteContext } from "./types";
