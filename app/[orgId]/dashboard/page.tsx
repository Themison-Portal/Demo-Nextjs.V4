"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { DashboardView } from "@/components/app/dashboard/DashboardView";

export default function DashboardPage({ orgId }: { orgId: string }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    if (isLoading) return <div>Loading...</div>;

    if (!user || user.organizationId !== orgId) {
        router.push("/unauthorized");
        return null;
    }

    const firstName = user.firstName || user.email.split("@")[0] || "User";

    return <DashboardView orgId={orgId} userName={firstName} orgName={user.organizationName} />;
}