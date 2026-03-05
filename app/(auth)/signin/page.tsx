"use client";

/**
 * Client Signin Page
 * Login form for clinic users (non-@themison.com)
 */

import { useRouter } from "next/navigation";
import { useSignin } from "@/hooks/useSignin";
import { authService } from "@/services/auth";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthForm } from "@/components/auth/AuthForm";
import { ROUTES } from "@/lib/routes";

export default function SigninPage() {
    const router = useRouter();
    const { mutate: signin, isPending, isError, error } = useSignin();

    const handleSubmit = async (data: any) => {
        signin(data, {
            onSuccess: async () => {
                try {
                    const user = await authService.getCurrentUser();

                    if (!user) {
                        console.error("User not found after signin");
                        return;
                    }

                    if (user.organizationId) {
                        router.push(ROUTES.APP.DASHBOARD(user.organizationId));
                    } else {
                        console.error("No organization found for user");
                    }
                } catch (err) {
                    console.error("Failed to fetch user after signin:", err);
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
