"use client";

/**
 * Staff Signin Page
 * Login form for @themison.com staff members
 */

import { useRouter } from "next/navigation";
import { useSignin } from "@/hooks/useSignin";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";

export default function SigninPage() {
  const router = useRouter();
  const { mutate: signin, isPending, isError, error } = useSignin();

  const handleSubmit = (data: any) => {
    signin(data, {
      onSuccess: () => {
        // Redirect to console dashboard on success
        router.push("/console");
      },
    });
  };

  return (
    <AuthCard
      title="Staff Console"
      description={
        <>
          Sign in with your <span className="font-medium">@themison.com</span>{" "}
          account
        </>
      }
    >
      <AuthForm
        mode="signin"
        onSubmit={handleSubmit}
        isPending={isPending}
        error={isError ? error?.message || "Invalid email or password. Please try again." : null}
      />
    </AuthCard>
  );
}
