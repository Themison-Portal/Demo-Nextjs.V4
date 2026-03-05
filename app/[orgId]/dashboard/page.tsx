import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { DashboardView } from "@/components/app/dashboard/DashboardView";

interface DashboardPageProps {
    params: Promise<{ orgId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
    const user = await getUser();
    const { orgId } = await params;

    if (!user || user.organizationId !== orgId) {
        redirect("/unauthorized");
    }

    const firstName = user.firstName || user.email.split("@")[0] || "User";

    return (
        <DashboardView
            orgId={orgId}
            userName={firstName}
            orgName={user.organizationName}
        />
    );
}