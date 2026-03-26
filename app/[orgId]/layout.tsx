"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AppMain } from "@/components/app/shared/AppMain";

interface AppLayoutProps {
    children: React.ReactNode;
    params: Promise<{ orgId: string }>
}

export default function AppLayout({ children, params }: AppLayoutProps) {
    const { orgId } = use(params);
    const router = useRouter();
    const { user, isLoading } = useAuth();

    console.log("USER:", user?.organizationId, "ORG:", orgId, "isStaff:", user?.isStaff)

    // Redirect only after auth check
    useEffect(() => {
        if (isLoading) return; // wait for auth

        // Not authenticated → go to signin
        if (!user) {
            router.replace("/signin");
            return;
        }

        // User cannot access this org → unauthorized
        // if (user.organizationId !== orgId && !user.isStaff) {
        //     router.replace("/unauthorized");
        //     return;
        // }
        // if (user.organizationId !== orgId && !user.isStaff) {
        //     router.replace("/unauthorized");
        //     return;
        // }
        if (!isLoading && (!user || (user.organizationId !== orgId && !user.isStaff))) {
            router.replace("/unauthorized");
            return;
        }
    }, [user, isLoading, orgId, router]);

    // Show loader while waiting for auth
    if (isLoading) return <div>Loading...</div>;

    // // Prevent flash content if unauthorized
    // if (!user || (user.organizationId !== orgId && !user.isStaff)) return null;
    // if (!user || (user.organizationId !== orgId && !user.isStaff)) return null;
    if (isLoading || !user || (user.organizationId !== orgId && !user.isStaff)) return null;

    const firstName = user.firstName || user.email?.split("@")[0] || "User";

    return (
        <AppMain
            orgId={orgId}
            userEmail={user.email}
            userFirstName={firstName}
        >
            {children}
        </AppMain>
    );
}