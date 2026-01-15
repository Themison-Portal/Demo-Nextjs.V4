"use client";

/**
 * SignupFormView
 * Client Component for invitation-based signup form
 * Handles form interaction and submission only (no validation logic)
 */

import { useSignup } from "@/hooks/useSignup";
import { AuthCard } from "./AuthCard";
import { AuthForm } from "./AuthForm";

interface SignupFormViewProps {
  /** Pre-filled email from invitation */
  email: string;
  /** Organization name from invitation */
  orgName: string;
}

export function SignupFormView({ email, orgName }: SignupFormViewProps) {
  const { mutate: signup, isPending, isError, error, isSuccess } = useSignup();

  const handleSubmit = (data: any) => {
    // Signup with role: 'member' for clinic users
    signup({ ...data, role: "member" });
  };

  // Success state - show confirmation message
  if (isSuccess) {
    return (
      <AuthCard
        title="Check your email"
        description={`We sent a confirmation link to ${email}`}
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            After confirming, you'll be able to access{" "}
            <span className="font-medium">{orgName}</span>.
          </p>
        </div>
      </AuthCard>
    );
  }

  // Form state
  return (
    <AuthCard
      title={`Join ${orgName}`}
      description="Complete your account setup"
    >
      <AuthForm
        mode="signup"
        onSubmit={handleSubmit}
        isPending={isPending}
        error={
          isError
            ? error?.message || "Something went wrong. Please try again."
            : null
        }
        requireThemisonEmail={false}
        prefilledEmail={email}
        invitationOrgName={orgName}
        readonlyEmail={true}
      />
    </AuthCard>
  );
}
