"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth0Client } from "@/lib/auth0";
import { ROUTES } from "@/lib/routes";
import { apiClient } from "@/lib/apiClient";

export default function AuthCallbackPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const handleAuth = async () => {
            try {
                const auth0 = await getAuth0Client();

                if (window.location.search.includes("code=")) {
                    await auth0.handleRedirectCallback();
                }

                const token = await auth0.getTokenSilently();

                if (!token) {
                    console.error("No token after callback");
                    router.push("/signin");
                    return;
                }

                // ✅ Set in localStorage for client-side apiClient
                localStorage.setItem("access_token", token);

                // ✅ Set via API route so cookie is available on the next server request
                // This ensures ConsoleProtectedLayout can read it immediately
                await fetch("/api/auth/set-token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                const user = await apiClient.getCurrentUser();

                if (!user) {
                    router.push("/signin");
                    return;
                }

                if (user.member.default_role === "staff") {
                    router.push(ROUTES.CONSOLE.HOME);
                } else if (user.organization?.id) {
                    router.push(ROUTES.APP.DASHBOARD(user.organization.id));
                } else {
                    router.push("/unauthorized");
                }

            } catch (err: any) {
                if (err.error === "missing_transaction" || err.message?.includes("state")) {
                    try {
                        const auth0 = await getAuth0Client();
                        const token = await auth0.getTokenSilently();

                        if (token) {
                            localStorage.setItem("access_token", token);

                            // ✅ Set cookie in recovery path too
                            await fetch("/api/auth/set-token", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ token }),
                            });

                            const user = await apiClient.getCurrentUser();
                            if (user?.member.default_role === "staff") {
                                router.push(ROUTES.CONSOLE.HOME);
                                return;
                            } else if (user?.organization?.id) {
                                router.push(ROUTES.APP.DASHBOARD(user.organization.id));
                                return;
                            }
                        }
                    } catch {
                        // token genuinely not available
                    }
                }

                console.error("Auth callback error:", err);
                router.push("/signin");
            }
        };

        handleAuth();
    }, []);

    return <div>Logging you in...</div>;
}