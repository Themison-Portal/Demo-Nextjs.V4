/**
 * Auth Guards for Layouts/Pages
 *
 * Server-side helpers for protecting Server Components.
 *
 * These guards:
 * - Do NOT validate JWT locally
 * - Do NOT access the database directly
 * - Delegate authentication & authorization to FastAPI
 *
 * All security decisions happen in the backend.
 */

import { redirect } from "next/navigation";
import { getUser } from "./getUser";
import { ROUTES } from "@/lib/routes";
import type { AuthUser } from "./getUser";

// ============================================================================
// Staff Guard
// ============================================================================

/**
 * Require staff authentication.
 * Redirects to signin if:
 *  - Not authenticated
 *  - Not a staff user
 */
export async function requireStaff(): Promise<AuthUser> {
    const user = await getUser();

    if (!user || !user.isStaff) {
        redirect(ROUTES.CONSOLE.SIGNIN);
    }

    return user;
}

// ============================================================================
// Organization Access Guard
// ============================================================================

export interface OrgAccessResult {
    user: AuthUser;
    org: {
        id: string;
        name: string;
        support_enabled: boolean;
    };
}

/**
 * Require organization access.
 *
 * Delegates **all access validation** to the backend.
 * Backend enforces:
 *   - Staff vs member access rules
 *   - Membership rules
 *   - support_enabled flag
 *
 * Frontend simply consumes the validated org object.
 */
export async function requireOrgAccess(
    orgId: string
): Promise<OrgAccessResult> {
    const user = await getUser();

    if (!user) {
        redirect(ROUTES.PUBLIC.HOME);
    }

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/organizations/${orgId}`,
        {
            credentials: "include",
            cache: "no-store",
        }
    );

    if (response.status === 401) {
        redirect(ROUTES.PUBLIC.HOME);
    }

    if (response.status === 403) {
        redirect(ROUTES.PUBLIC.ERROR_WITH_MESSAGE("Unauthorized"));
    }

    if (!response.ok) {
        redirect(
            ROUTES.PUBLIC.ERROR_WITH_MESSAGE("Organization not found")
        );
    }

    const org = await response.json();

    return {
        user,
        org,
    };
}

// ============================================================================
// Public Guard
// ============================================================================

/**
 * Mark a route as intentionally public.
 * No authentication required.
 */
export async function requirePublic(): Promise<void> {
    return;
}