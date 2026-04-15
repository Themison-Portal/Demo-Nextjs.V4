import { apiClient } from "@/lib/apiClient";
import { getAuth0Client } from "@/lib/auth0";
import type { User } from "./types";

export const authService = {
    /**
     * Login via Auth0 Universal Login
     */
    async signin(): Promise<void> {
        const auth0 = await getAuth0Client();

        await auth0.loginWithRedirect({
            authorizationParams: {
                prompt: "login",
                redirect_uri: window.location.origin + "/auth/callback",
            },
        });
    },

    /**
     * Logout from Auth0
     */
    async signout(): Promise<void> {
        localStorage.removeItem('access_token');
        const auth0 = await getAuth0Client();

        await auth0.logout({
            logoutParams: {
                returnTo: window.location.origin,
            },
        });
    },

    /**
     * Get current authenticated user from backend
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            const data = await apiClient.getCurrentUser();

            const role =
                data.member.default_role === "staff" ||
                    data.member.default_role === "member"
                    ? data.member.default_role
                    : undefined;

            return {
                id: data.member.id,
                email: data.member.email,
                firstName: data.profile?.first_name,
                lastName: data.profile?.last_name,
                organizationId: data.organization?.id,
                organizationName: data.organization?.name,
                role,
                onboardingCompleted: data.member.onboarding_completed,
                isStaff: role === "staff",
            };
        } catch (err) {
            console.error("Failed to get current user:", err);
            return null;
        }
    },
};