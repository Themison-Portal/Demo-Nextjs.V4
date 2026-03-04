/**
 * withTrialMember Middleware
 * Thin wrapper — trial access enforced by FastAPI backend
 *
 * Backend already validates:
 * - Auth0 JWT
 * - Organization ownership
 * - Trial existence
 * - Membership (if implemented server-side)
 */

import { withAuth } from "./withAuth";
import { AuthHandler, responses } from "./types";

export function withTrialMember(handler: AuthHandler) {
    return withAuth(async (req, ctx, user) => {
        const { trialId } = ctx.params;

        if (!trialId) {
            return responses.badRequest("Trial ID required");
        }

        // Do NOT check:
        // - Org membership
        // - Trial membership
        // - Role permissions
        //
        // FastAPI handles all authorization logic.
        // If unauthorized, backend will return 403 or 404.

        return handler(req, ctx, user);
    });
}