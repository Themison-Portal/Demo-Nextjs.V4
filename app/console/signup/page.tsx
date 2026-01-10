"use client";

/**
 * Staff Signup Page
 * Registration form for @themison.com staff members
 */

import { useState } from "react";
import { useSignup } from "@/hooks/useSignup";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  const { mutate: signup, isPending, isError, error, isSuccess } = useSignup();
  const [submittedEmail, setSubmittedEmail] = useState("");

  const handleSubmit = (data: any) => {
    setSubmittedEmail(data.email);
    signup(data);
  };

  if (isSuccess) {
    return (
      <AuthCard
        title="Check your email"
        description={`We sent a confirmation link to ${submittedEmail}`}
      >
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link to activate your account. Check your Themison Emails
          </p>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Staff Console"
      description={
        <>
          For authorized <span className="font-medium">@themison.com</span>{" "}
          users only
        </>
      }
    >
      <AuthForm
        mode="signup"
        onSubmit={handleSubmit}
        isPending={isPending}
        error={isError ? error?.message || "Something went wrong. Please try again." : null}
      />
    </AuthCard>
  );
}
