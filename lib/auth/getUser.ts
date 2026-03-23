/**
 * Get User Utility
 * Server-side helper to retrieve the authenticated user.
 *
 * This does NOT validate JWT locally.
 * It delegates authentication to the FastAPI backend (/auth/me endpoint),
 * which verifies the Auth0 JWT and resolves membership.
 */

import { cookies } from "next/headers";

export interface AuthUser {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isStaff: boolean;
    organizationId?: string;
    organizationName?: string;
    memberId?: string;
    role?: string;
}

/**
 * Fetch the authenticated user from the backend.
 *
 * Returns:
 *   - AuthUser object if authenticated
 *   - null if not authenticated or token is invalid
 *
 * Security Model:
 *   - JWT is read from the access_token cookie (set by AuthCallbackPage)
 *   - Token is forwarded to FastAPI as Authorization: Bearer header
 *   - FastAPI validates the JWT via Auth0
 *   - Frontend never verifies or decodes tokens directly
 */
export async function getUser(): Promise<AuthUser | null> {
    try {
        // ✅ Read token from cookie — server components cannot access localStorage
        const cookieStore = await cookies();
        const token = cookieStore.get("access_token")?.value;

        if (!token) {
            console.warn("User not authenticated");
            return null;
        }

        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
                headers: {
                    Authorization: `Bearer ${token}`, // ✅ forward token to FastAPI
                },
                cache: "no-store", // prevent caching authenticated responses
            }
        );

        if (response.status === 401) {
            console.warn("User not authenticated");
            return null;
        }

        if (!response.ok) {
            console.error("Failed to fetch user", response.status);
            return null;
        }

        const data = await response.json();

        return {
            id: data.member.id,
            email: data.member.email,
            firstName: data.profile?.first_name,
            lastName: data.profile?.last_name,
            isStaff: data.member.default_role === "staff",
            organizationId: data.organization?.id,
            organizationName: data.organization?.name,
            memberId: data.member?.id,
            role: data.member?.default_role,
        };
    } catch {
        return null;
    }
}