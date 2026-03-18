"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { useSignin } from "@/hooks/useSignin";

export default function SigninPage() {
    const { mutate: signin, isPending, isError, error } = useSignin();

    const handleSubmit = async (data: any) => {
        // Trigger Auth0 redirect
        signin(data);
        // DO NOT fetch /me here — handled in AuthCallbackPage + AuthLayout
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