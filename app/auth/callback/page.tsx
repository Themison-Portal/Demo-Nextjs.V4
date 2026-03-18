"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth0Client } from "@/lib/auth0";
import { ROUTES } from "@/lib/routes";
import { apiClient } from "@/lib/apiClient"; // make sure this points to your apiClient

export default function AuthCallbackPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const handleAuth = async () => {
            try {
                // Initialize Auth0 client
                const auth0 = await getAuth0Client();

                // Handle redirect if URL contains code
                if (window.location.search.includes("code=")) {
                    const auth0 = await getAuth0Client();
                    await auth0.handleRedirectCallback();
                    const token = await auth0.getTokenSilently();
                    localStorage.setItem("access_token", token);

                    // Now useAuth will fetch the user
                    window.history.replaceState({}, document.title, "/"); // clean URL
                }

                // Fetch current user from backend
                const user = await apiClient.getCurrentUser(); // calls /auth/me
                if (!user) {
                    router.push("/signin");
                    return;
                }

                // Redirect based on user role/org
                if (user.member.default_role === "staff") {
                    router.push(ROUTES.CONSOLE.HOME);
                } else if (user.organization?.id) {
                    router.push(ROUTES.APP.DASHBOARD(user.organization.id));
                } else {
                    router.push("/unauthorized");
                }
            } catch (err) {
                console.error("Auth callback error:", err);
                router.push("/signin");
            } finally {
                setLoading(false);
            }
        };

        handleAuth();
    }, [router]);

    if (loading) return <div>Logging you in...</div>;

    return null;
}