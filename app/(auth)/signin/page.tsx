"use client";

/**
 * Client Signin Page
 * Login form for clinic users (non-@themison.com)
 */

import { useRouter } from "next/navigation";
import { useSignin } from "@/hooks/useSignin";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/routes";

export default function SigninPage() {
  const router = useRouter();
  const { mutate: signin, isPending, isError, error } = useSignin();

  const handleSubmit = async (data: any) => {
    signin(data, {
      onSuccess: async () => {
        // After successful signin, find user's organization
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          return;
        }

        // Get user's organization from organization_members
        const { data: membership } = await supabase
          .from("organization_members")
          .select("org_id")
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .single();

        if (membership?.org_id) {
          // Redirect to organization dashboard
          router.push(ROUTES.APP.DASHBOARD(membership.org_id));
        } else {
          // Fallback: no organization found (shouldn't happen)
          console.error("No organization found for user");
        }
      },
    });
  };

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to access your organization"
    >
      <AuthForm
        mode="signin"
        onSubmit={handleSubmit}
        isPending={isPending}
        error={
          isError
            ? error?.message || "Invalid email or password. Please try again."
            : null
        }
        requireThemisonEmail={false}
      />
    </AuthCard>
  );
}
