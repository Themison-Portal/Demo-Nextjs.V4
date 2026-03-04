/**
 * Get User Utility
 * Server-side helper to retrieve the authenticated user.
 *
 * This does NOT validate JWT locally.
 * It delegates authentication to the FastAPI backend (/me endpoint),
 * which verifies the Auth0 JWT and resolves membership.
 */

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
 *   - JWT is stored in an httpOnly cookie
 *   - This function sends cookies automatically (credentials: "include")
 *   - FastAPI validates the JWT via Auth0
 *   - Frontend never verifies or decodes tokens directly
 */
export async function getUser(): Promise<AuthUser | null> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/me`,
            {
                credentials: "include", // sends httpOnly cookie
                cache: "no-store",      // prevent caching authenticated responses
            }
        );

        if (!response.ok) return null;

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