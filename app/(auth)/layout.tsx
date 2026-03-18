"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";

/**
 * Client-side Auth Layout
 * Redirects authenticated users to dashboard/console
 */
export default function SigninLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            // Staff → console
            if (user.isStaff) {
                router.push(ROUTES.CONSOLE.HOME);
            }
            // Client → dashboard
            else if (user.organizationId) {
                router.push(ROUTES.APP.DASHBOARD(user.organizationId));
            }
        }
    }, [user, isLoading, router]);

    if (isLoading) return <div>Loading...</div>;

    // Not authenticated → show children (signin page)
    return <>{children}</>;
}