"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { useSignin } from "@/hooks/useSignin";
import { Button } from "@/components/ui/button";

export default function SigninPage() {
    const { mutate: signin, isPending } = useSignin();

    return (
        <AuthCard
            title="Welcome back"
            description="Sign in to access your organization"
        >
            <Button
                onClick={() => signin()}
                disabled={isPending}
                className="w-full"
            >
                {isPending ? "Redirecting..." : "Sign in"}
            </Button>
        </AuthCard>
    );
}