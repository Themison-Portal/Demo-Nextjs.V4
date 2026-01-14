"use client";

/**
 * Public Signup Page
 * For clinic users invited via invitation link
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useValidateInvitation } from "@/hooks/useValidateInvitation";
import { useSignup } from "@/hooks/useSignup";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const {
    data: validationData,
    isLoading: isValidating,
    error: validationError,
  } = useValidateInvitation(token);

  const { mutate: signup, isPending, isError, error, isSuccess } = useSignup();
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = (data: any) => {
    setSubmittedEmail(data.email);
    // Signup with role: 'member' for clinic users
    signup({ ...data, role: 'member' });
  };

  // No token provided
  if (!token) {
    return (
      <AuthCard title="Invalid Link" description="No invitation token provided">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            This page requires a valid invitation link.
          </p>
          <p className="text-sm text-muted-foreground">
            Please check your email for the invitation.
          </p>
        </div>
      </AuthCard>
    );
  }

  // Validating token
  if (isValidating) {
    return (
      <AuthCard title="Validating Invitation" description="Please wait...">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Verifying your invitation...
          </p>
        </div>
      </AuthCard>
    );
  }

  // Invalid token
  if (validationError || !validationData?.valid) {
    const errorMessage =
      validationError?.message ||
      validationData?.error ||
      "Invalid invitation";

    return (
      <AuthCard title="Invalid Invitation" description={errorMessage}>
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            {validationData?.details || "This invitation link is not valid."}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact your organization administrator.
          </p>
        </div>
      </AuthCard>
    );
  }

  // Signup successful
  if (isSuccess) {
    return (
      <AuthCard
        title="Check your email"
        description={`We sent a confirmation link to ${submittedEmail}`}
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to activate your account.
          </p>
          <p className="text-sm text-muted-foreground">
            After confirming, you'll be able to access{" "}
            <span className="font-medium">
              {validationData.invitation?.organization.name}
            </span>
            .
          </p>
        </div>
      </AuthCard>
    );
  }

  // Show signup form
  const invitation = validationData.invitation!;

  return (
    <AuthCard
      title={`Join ${invitation.organization.name}`}
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
        prefilledEmail={invitation.email}
        readonlyEmail={true}
      />
    </AuthCard>
  );
}
