/**
 * Public Signup Page (Server Component)
 * For invitation-based signup (clinic users, staff, admins)
 * Validates token server-side and renders appropriate UI
 */

import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { SignupFormView } from "@/components/auth/SignupFormView";
import { validateInvitationToken } from "@/lib/auth";
import { ROUTES } from "@/lib/routes";

interface SignupPageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
    const params = await searchParams;
    const result = await validateInvitationToken(params.token || null);

    // No token → redirect to signin
    if (!result.valid && result.error === "no_token") {
        redirect(ROUTES.PUBLIC.SIGNIN);
    }

    // Invalid token
    if (!result.valid && result.error === "not_found") {
        return (
            <AuthCard title="Invalid Invitation" description="Token not found">
                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This invitation link is not valid.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Please contact your organization administrator for a new invitation.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={ROUTES.PUBLIC.SIGNIN}>Back to Sign In</Link>
                    </Button>
                </div>
            </AuthCard>
        );
    }

    // Invalid status (already used, revoked, etc.)
    if (!result.valid && result.error === "not_pending") {
        return (
            <AuthCard
                title="Invitation Not Available"
                description={result.details || "Invitation is no longer pending"}
            >
                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This invitation has already been used or is no longer valid.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        If you already have an account, please sign in.
                    </p>
                    <Button asChild className="w-full">
                        <Link href={ROUTES.PUBLIC.SIGNIN}>Go to Sign In</Link>
                    </Button>
                </div>
            </AuthCard>
        );
    }

    // Expired
    if (!result.valid && result.error === "expired") {
        return (
            <AuthCard title="Invitation Expired" description="Token has expired">
                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        This invitation link has expired. Invitations are valid for 7 days.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Please contact your organization administrator for a new invitation.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={ROUTES.PUBLIC.SIGNIN}>Back to Sign In</Link>
                    </Button>
                </div>
            </AuthCard>
        );
    }

    // User already exists
    if (!result.valid && result.error === "user_exists") {
        return (
            <AuthCard
                title="Account Already Exists"
                description="This email is already registered"
            >
                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        An account with this email already exists. Please sign in to access
                        your organization.
                    </p>
                    <Button asChild className="w-full">
                        <Link href={ROUTES.PUBLIC.SIGNIN}>Sign In</Link>
                    </Button>
                </div>
            </AuthCard>
        );
    }

    // Type guard: catch-all for unexpected errors
    if (!result.valid) {
        return (
            <AuthCard title="Error" description="Something went wrong">
                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        An unexpected error occurred while validating your invitation.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Please try again or contact support if the problem persists.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href={ROUTES.PUBLIC.SIGNIN}>Back to Sign In</Link>
                    </Button>
                </div>
            </AuthCard>
        );
    }

    // Valid invitation → render form (wrapped in Suspense for useSearchParams)
    return (
        <Suspense
            fallback={
                <AuthCard title="Loading..." description="Please wait">
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                            Loading your invitation...
                        </p>
                    </div>
                </AuthCard>
            }
        >
            <SignupFormView
                email={result.invitation.email}
                orgName={result.invitation.organization_name || "your organization"}
            />
        </Suspense>
    );
}