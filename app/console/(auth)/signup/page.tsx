"use client";

/**
 * Staff Signup Page
 * Themison staff accounts are invitation-only.
 * This page exists to handle anyone who bookmarks or navigates here directly.
 */

import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/routes";

export default function SignupPage() {
    return (
        <AuthCard
            title="Staff Access"
            description="Themison staff accounts are invitation-only"
        >
            <div className="space-y-6">
                <div className="flex justify-center">
                    <div className="rounded-full bg-blue-50 p-4">
                        <Mail className="h-8 w-8 text-blue-600" />
                    </div>
                </div>

                <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                        New Themison staff members are onboarded by existing administrators
                        through an invitation link sent to their email.
                    </p>

                    <p className="text-sm text-muted-foreground">
                        If you need access, please contact your administrator or email{" "}

                        href="mailto:support@themison.com"
                        className="text-primary font-medium hover:underline"
            >
                        support@themison.com
                    </a>
                    .
                </p>
            </div>

            <div className="space-y-3 pt-4">
                <Button asChild className="w-full">
                    <Link href={ROUTES.CONSOLE.SIGNIN}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sign In
                    </Link>
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                    Already received an invitation?{" "}
                    <Link
                        href="/signup"
                        className="text-primary hover:underline"
                    >
                        Click here
                    </Link>
                </p>
            </div>
        </div>
    </AuthCard >
  );
}