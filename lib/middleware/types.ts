/**
 * Middleware Types
 * Type definitions for API route middleware
 */

import { NextRequest } from "next/server";
import { AuthUser } from "@/lib/auth";

/**
 * Context passed to route handlers
 * Includes route params (orgId, trialId, etc.)
 */
export interface RouteContext {
  params: Record<string, string>;
}

/**
 * Authenticated route handler
 * Receives request, context, and validated user
 */
export type AuthHandler = (
  req: NextRequest,
  ctx: RouteContext,
  user: AuthUser
) => Promise<Response>;

/**
 * Standard response helpers
 */
export const responses = {
  unauthorized: () =>
    Response.json({ error: "Unauthorized" }, { status: 401 }),

  forbidden: (message = "Forbidden") =>
    Response.json({ error: message }, { status: 403 }),

  notFound: (message = "Not found") =>
    Response.json({ error: message }, { status: 404 }),

  badRequest: (message = "Bad request") =>
    Response.json({ error: message }, { status: 400 }),

  serverError: (message = "Internal server error") =>
    Response.json({ error: message }, { status: 500 }),
};
