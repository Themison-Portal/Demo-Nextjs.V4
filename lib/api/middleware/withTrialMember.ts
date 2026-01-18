/**
 * withTrialMember Middleware
 * Trial-scope access check
 * User must be: org admin (full access) OR assigned to the trial
 *
 * This is the primary middleware for trial-level endpoints.
 * It provides the user's context (orgRole, trialRole) for permission checks.
 *
 * Usage:
 * - For READ operations: just use this middleware
 * - For WRITE operations: use this + check specific permission with getTrialPermissions()
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgMember, type OrgMemberUser } from "./withOrgMember";
import { responses } from "./types";
import { isAdminRole, type OrgRole, type TrialRole } from "@/lib/permissions/constants";

// ============================================================================
// TYPES
// ============================================================================

export interface TrialMemberUser extends OrgMemberUser {
  /** User's role in this specific trial (null if org admin accessing without assignment) */
  trialRole: TrialRole | null;
}

export type TrialMemberHandler = (
  req: Request,
  ctx: { params: Record<string, string> },
  user: TrialMemberUser
) => Promise<Response>;

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Wraps a route handler with trial member check
 *
 * Access rules:
 * - Org admin (superadmin/admin) → allowed (trialRole = null)
 * - Staff with support_enabled → allowed (trialRole = null)
 * - Trial team member → allowed (trialRole = their role)
 * - Otherwise → forbidden
 *
 * @example
 * // Read operation - just check access
 * export const GET = withTrialMember(async (req, ctx, user) => {
 *   // user has access, fetch and return data
 * });
 *
 * @example
 * // Write operation - check specific permission
 * export const PATCH = withTrialMember(async (req, ctx, user) => {
 *   const perms = getTrialPermissions(user.orgRole, user.trialRole);
 *   if (!perms.canEditTrial) {
 *     return responses.forbidden("Cannot edit this trial");
 *   }
 *   // proceed with update
 * });
 */
export function withTrialMember(handler: TrialMemberHandler) {
  return withOrgMember(async (req, ctx, user) => {
    const { trialId } = ctx.params;

    if (!trialId) {
      return responses.badRequest("Trial ID required");
    }

    const supabase = await createClient();

    // Verify trial exists and belongs to this org
    const { orgId } = ctx.params;
    const { data: trial, error: trialError } = await supabase
      .from("trials")
      .select("id, org_id")
      .eq("id", trialId)
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .single();

    if (trialError || !trial) {
      return responses.notFound("Trial not found");
    }

    // CASE 1: Org admin or staff → full access without needing trial assignment
    if (isAdminRole(user.orgRole)) {
      // Check if they happen to have a trial role (for context)
      const { data: trialMember } = await supabase
        .from("trial_team_members")
        .select("trial_role")
        .eq("trial_id", trialId)
        .eq("org_member_id", user.orgMemberId)
        .single();

      return handler(req, ctx, {
        ...user,
        trialRole: (trialMember?.trial_role as TrialRole) || null,
      });
    }

    // CASE 2: Non-admin → must be assigned to trial
    const { data: trialMember, error: memberError } = await supabase
      .from("trial_team_members")
      .select("trial_role")
      .eq("trial_id", trialId)
      .eq("org_member_id", user.orgMemberId)
      .single();

    if (memberError || !trialMember) {
      return responses.forbidden("Not a member of this trial");
    }

    return handler(req, ctx, {
      ...user,
      trialRole: trialMember.trial_role as TrialRole,
    });
  });
}
