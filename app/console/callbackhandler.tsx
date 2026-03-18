"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth0Client } from "@/lib/auth0";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";

export default function AuthCallbackPage() {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        const handleAuth = async () => {
            const auth0 = await getAuth0Client();

            // Only handle redirect if URL contains code
            if (window.location.search.includes("code=")) {
                await auth0.handleRedirectCallback();
                window.history.replaceState({}, document.title, "/"); // clean URL
            }

            // Wait for user to be fetched
            if (!isLoading && user) {
                if (user.isStaff) {
                    router.push(ROUTES.CONSOLE.HOME);
                } else if (user.organizationId) {
                    router.push(ROUTES.APP.DASHBOARD(user.organizationId));
                } else {
                    router.push("/unauthorized");
                }
            }
        };

        handleAuth();
    }, [router, user, isLoading]);

    return <div>Logging you in...</div>;
}