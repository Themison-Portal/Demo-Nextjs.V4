"use client";

import { useEffect } from "react";
import { useSignup } from "@/hooks/useSignup";
import { getAuth0Client } from "@/lib/auth0";
import { AuthCard } from "./AuthCard";
import { AuthForm } from "./AuthForm";

interface SignupFormViewProps {
    email: string;
    orgName: string;
}

export function SignupFormView({ email, orgName }: SignupFormViewProps) {
    const { mutate: signup, isPending, isError, error, isSuccess } = useSignup();

    // Auto signin after successful signup
    useEffect(() => {
        if (isSuccess) {
            const timer = setTimeout(async () => {
                const auth0 = await getAuth0Client();
                await auth0.loginWithRedirect({
                    authorizationParams: {
                        redirect_uri: window.location.origin + "/auth/callback",
                        login_hint: email,
                    },
                });
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [isSuccess, email]);

    const handleSubmit = (data: any) => {
        signup({
            password: data.password,
            first_name: data.firstName,
            last_name: data.lastName,
        });
    };

    if (isSuccess) {
        return (
            <AuthCard
                title="Account created!"
                description={`Welcome to ${orgName}`}
            >
                <div className="text-center space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Your account has been created. Signing you in...
                    </p>
                </div>
            </AuthCard>
        );
    }

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