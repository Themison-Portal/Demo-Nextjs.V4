/**
 * Public Signup Page (Server Component)
 * For clinic users invited via invitation link
 * Validates token server-side and renders appropriate UI
 */

import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
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
            Please contact your organization administrator.
          </p>
        </div>
      </AuthCard>
    );
  }

  // Invalid status
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
            Please contact your organization administrator.
          </p>
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
            This invitation link has expired.
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your organization administrator for a new invitation.
          </p>
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
            An account with this email already exists.
          </p>
          <p className="text-sm text-muted-foreground">
            Please sign in to access your organization.
          </p>
        </div>
      </AuthCard>
    );
  }

  // Type guard: at this point result must be valid
  if (!result.valid) {
    return (
      <AuthCard title="Error" description="Unknown error">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred.
          </p>
        </div>
      </AuthCard>
    );
  }

  // Valid invitation → render form
  return (
    <SignupFormView
      email={result.invitation.email}
      orgName={result.invitation.organization.name}
    />
  );
}
