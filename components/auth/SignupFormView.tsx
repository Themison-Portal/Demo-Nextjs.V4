"use client";

import { useSignup } from "@/hooks/useSignup";
import { AuthCard } from "./AuthCard";
import { AuthForm } from "./AuthForm";

interface SignupFormViewProps {
    email: string;
    orgName: string;
}

export function SignupFormView({ email, orgName }: SignupFormViewProps) {
    const { mutate: signup, isPending, isError, error, isSuccess } = useSignup();

    const handleSubmit = (data: any) => {
        // Transform camelCase form data to snake_case for backend
        signup({
            password: data.password,
            first_name: data.firstName,  // ⭐ Transform here
            last_name: data.lastName,     // ⭐ Transform here
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
                        Your account has been created. Redirecting you to sign in...
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