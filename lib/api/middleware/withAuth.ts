/**
 * withAuth Middleware
 * Base authentication middleware
 * Delegates authentication to backend (Auth0 + FastAPI)
 */

import { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { AuthHandler, RouteContext, responses } from "./types";

/**
 * Wraps a route handler with authentication check.
 * Returns 401 if user is not authenticated.
 *
 * Frontend does NOT validate JWT locally; all checks happen in backend.
 *
 * @example
 * export const GET = withAuth(async (req, ctx, user) => {
 *   return Response.json({ userId: user.id });
 * });
 */
export function withAuth(handler: AuthHandler) {
    return async (
        req: NextRequest,
        ctx: { params: Promise<Record<string, string>> }
    ): Promise<Response> => {
        // Validate JWT by calling backend /me endpoint
        const user = await getUser();

        if (!user) {
            return responses.unauthorized();
        }

        // Resolve params Promise (Next.js 15+)
        const params = await ctx.params;

        // User authenticated → call handler with resolved params
        return handler(req, { params }, user);
    };
}
