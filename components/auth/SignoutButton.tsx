"use client";

/**
 * SignoutButton
 * Simple button to sign out client users
 */

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/lib/routes";

export function SignoutButton() {
  const router = useRouter();
  const { signout, isSigningOut } = useAuth();

  const handleSignout = async () => {
    try {
      await signout();
      router.push(ROUTES.PUBLIC.SIGNIN);
    } catch (error) {
      console.error("Signout error:", error);
    }
  };

  return (
    <button
      onClick={handleSignout}
      disabled={isSigningOut}
      className="px-4 py-2 rounded-md border hover:bg-accent disabled:opacity-50"
    >
      {isSigningOut ? "Signing out..." : "Sign out"}
    </button>
  );
}
