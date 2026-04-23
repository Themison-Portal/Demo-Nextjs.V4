"use client";

import { AuthCard } from "@/components/auth/AuthCard";
import { useSignin } from "@/hooks/useSignin";
import { Button } from "@/components/ui/button";

export default function SigninPage() {
    const { mutate: signin, isPending } = useSignin();

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
            <Button
                onClick={() => signin()}
                disabled={isPending}
                className="w-full"
            >
                {isPending ? "Redirecting..." : "Sign in with Themison"}
            </Button>
        </AuthCard>
    );
}