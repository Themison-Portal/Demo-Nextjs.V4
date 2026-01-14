/**
 * AuthForm Component
 * Reusable authentication form
 * Supports both signup and signin modes
 */

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "signup" | "signin";

interface AuthFormProps {
  mode: AuthMode;
  onSubmit: (data: SignupFormData | SigninFormData) => void;
  isPending: boolean;
  error?: string | null;
  requireThemisonEmail?: boolean; // Default: true (for staff signup)
  prefilledEmail?: string; // For invitation-based signup
  readonlyEmail?: boolean; // For invitation-based signup
  invitationOrgName?: string; // For invitation-based signup
}

interface SignupFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface SigninFormData {
  email: string;
  password: string;
}

export function AuthForm({
  mode,
  onSubmit,
  isPending,
  error,
  requireThemisonEmail = true, // Default to true for staff signup
  prefilledEmail = "",
  readonlyEmail = false,
  invitationOrgName,
}: AuthFormProps) {
  const [formData, setFormData] = useState<SignupFormData>({
    email: prefilledEmail,
    password: "",
    firstName: "",
    lastName: "",
  });

  const [emailError, setEmailError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate @themison.com email only if required
    if (
      requireThemisonEmail &&
      !formData.email.toLowerCase().endsWith("@themison.com")
    ) {
      setEmailError("Only @themison.com emails are allowed");
      return;
    }

    setEmailError("");

    // Submit based on mode
    if (mode === "signup") {
      onSubmit(formData);
    } else {
      onSubmit({
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    // Clear email error on change
    if (e.target.name === "email") {
      setEmailError("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "signup" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              required
              value={formData.firstName}
              onChange={handleChange}
              disabled={isPending}
              placeholder="John"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              required
              value={formData.lastName}
              onChange={handleChange}
              disabled={isPending}
              placeholder="Doe"
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          value={formData.email}
          onChange={handleChange}
          disabled={isPending || readonlyEmail}
          readOnly={readonlyEmail}
          placeholder={
            requireThemisonEmail ? "john@themison.com" : "your@email.com"
          }
        />
        {emailError && <p className="text-sm text-destructive">{emailError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={formData.password}
          onChange={handleChange}
          disabled={isPending}
          placeholder="••••••••"
          minLength={6}
        />
      </div>

      {error && <div className="text-sm text-destructive">{error}</div>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending
          ? mode === "signup"
            ? "Creating account..."
            : "Signing in..."
          : mode === "signup"
          ? requireThemisonEmail
            ? "Create Staff Account"
            : `Join to ${invitationOrgName}`
          : "Sign In"}
      </Button>

      <div className="text-center text-sm text-muted-foreground">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link
              href="/console/signin"
              className="text-primary hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don't have an account?{" "}
            <Link
              href="/console/signup"
              className="text-primary hover:underline"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
