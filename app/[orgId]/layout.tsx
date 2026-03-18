// app/[orgId]/layout.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppMain } from "@/components/app/shared/AppMain";

/**
 * App Layout - Organization App
 * Client-side protected layout for clinic users
 *
 * Uses useAuth() hook to fetch current user and validate organization access
 * Redirects unauthorized users to /unauthorized
 */

interface AppLayoutProps {
    children: React.ReactNode;
    params: { orgId: string };
}

export default function AppLayout({ children, params }: AppLayoutProps) {
    const { orgId } = params;
    const router = useRouter();
    const { user, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading) {
            // Not authenticated → redirect to signin
            if (!user) {
                router.push("/signin");
                return;
            }

            // Check organization access
            if (user.organizationId !== orgId) {
                router.push("/unauthorized");
                return;
            }
        }
    }, [user, isLoading, orgId, router]);

    if (isLoading) return <div>Loading...</div>;

    const firstName = user?.firstName || user?.email?.split("@")[0] || "User";

    return (
        <AppMain
            orgId={orgId}
            userEmail={user?.email}
            userFirstName={firstName}
        >
            {children}
        </AppMain>
    );
}