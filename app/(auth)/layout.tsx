/**
 * Auth Layout
 * Public layout for client authentication (signin/signup)
 * Redirects authenticated users to their appropriate dashboard
 */

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { ROUTES } from "@/lib/routes";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getUser();

    // Not authenticated → allow access to signin/signup
    if (!user) {
        return <>{children}</>;
    }

    // Staff user → redirect to console
    if (user.isStaff) {
        redirect(ROUTES.CONSOLE.HOME);
    }

    // Client user → redirect to their organization dashboard
    if (user.organizationId) {
        redirect(ROUTES.APP.DASHBOARD(user.organizationId));
    }

    // Fallback: user has no organization
    redirect(ROUTES.PUBLIC.ERROR_WITH_MESSAGE("No organization found"));
}