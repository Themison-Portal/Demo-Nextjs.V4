"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && user) {
            // Staff user → console
            if (user.isStaff) {
                router.push(ROUTES.CONSOLE.HOME);
            }
            // Client user → dashboard
            else if (user.organizationId) {
                router.push(ROUTES.APP.DASHBOARD(user.organizationId));
            }
        }
    }, [user, isLoading]);

    if (isLoading) return <div>Loading...</div>;

    // Not authenticated → allow signin/signup
    return <>{children}</>;
}