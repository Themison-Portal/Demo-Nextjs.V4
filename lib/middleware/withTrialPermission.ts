/**
 * withTrialPermission Middleware
 * Trial-scope permission check
 * User must be in trial_team, superadmin, admin, or staff with support enabled
 */

import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withAuth } from "./withAuth";
import { AuthHandler, RouteContext, responses } from "./types";

/**
 * Wraps a route handler with trial permission check
 * Allows: trial_team members, superadmin, admin, staff (if support_enabled)
 *
 * @example
 * export const POST = withTrialPermission(async (req, ctx, user) => {
 *   const { trialId } = ctx.params;
 *   // User has access to this trial
 *   // Create task, enroll patient, upload document, etc.
 * });
 */
export function withTrialPermission(handler: AuthHandler) {
  return withAuth(async (req, ctx, user) => {
    const { trialId } = ctx.params;

    if (!trialId) {
      return responses.badRequest("Trial ID required");
    }

    const supabase = await createClient();

    // Get trial with org_id
    const { data: trial } = await supabase
      .from("trials")
      .select("id, org_id")
      .eq("id", trialId)
      .is("deleted_at", null)
      .single();

    if (!trial) {
      return responses.notFound("Trial not found");
    }

    // CASE 1: Staff with support enabled
    if (user.isStaff) {
      const { data: org } = await supabase
        .from("organizations")
        .select("support_enabled")
        .eq("id", trial.org_id)
        .single();

      if (!org) {
        return responses.notFound("Organization not found");
      }

      if (!org.support_enabled) {
        return responses.forbidden("Support access not enabled for this organization");
      }

      // Staff + support enabled → allowed
      return handler(req, ctx, user);
    }

    // CASE 2: Superadmin or Admin (automatic access to all trials)
    const { data: member } = await supabase
      .from("organization_members")
      .select("org_role, status")
      .eq("user_id", user.id)
      .eq("org_id", trial.org_id)
      .single();

    if (member && member.status === "active") {
      if (["superadmin", "admin"].includes(member.org_role)) {
        // Superadmin/Admin → allowed (extraordinary permission)
        return handler(req, ctx, user);
      }
    }

    // CASE 3: Trial team member
    const { data: trialMember } = await supabase
      .from("trial_team")
      .select("user_id, status")
      .eq("user_id", user.id)
      .eq("trial_id", trialId)
      .single();

    if (!trialMember) {
      return responses.forbidden("Not a member of this trial");
    }

    if (trialMember.status !== "active") {
      return responses.forbidden("Trial membership is not active");
    }

    // Trial team member → allowed
    return handler(req, ctx, user);
  });
}
