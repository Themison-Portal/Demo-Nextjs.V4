/**
 * Auth Utilities
 * Server-side authentication helpers
 */

export { getUser } from "./getUser";
export type { AuthUser } from "./getUser";

export {
  requireStaff,
  requireOrgAccess,
  requirePublic,
  type OrgAccessResult,
} from "./guards";

export {
  validateInvitationToken,
  type InvitationValidation,
  type InvitationValidationResult,
  type InvitationValidationError,
} from "./validateInvitationToken";
