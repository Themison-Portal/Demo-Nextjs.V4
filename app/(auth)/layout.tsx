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
        if (isLoading) return; // wait until auth resolves

        // Only redirect if user exists
        if (!user) return;

        if (user.isStaff) {
            router.replace(ROUTES.CONSOLE.HOME);
        } else if (user.organizationId) {
            router.replace(ROUTES.APP.DASHBOARD(user.organizationId));
        }
    }, [user, isLoading, router]);

    if (isLoading) return <div>Loading...</div>;

    // Not authenticated → render signin page
    return <>{children}</>;
}