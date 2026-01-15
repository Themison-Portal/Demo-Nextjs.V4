/**
 * Auth Service
 * Handles authentication operations
 * Client-side service that calls backend API routes
 */

import { createClient } from "@/lib/supabase/client";
import type { SignupData, SignupResponse, SigninData, SigninResponse, User } from "./types";
import { ROUTES } from "@/lib/routes";

export const authService = {
  /**
   * Signup (client-side PKCE flow)
   * Supports both staff (@themison.com) and clinic users
   * @param data - Signup data including optional role (defaults to 'staff')
   */
  async signup(data: SignupData): Promise<SignupResponse> {
    const supabase = createClient();

    // Determine role: use provided role or default to 'staff' for @themison.com
    const userRole = data.role || 'staff';

    // SignUp client-side (PKCE flow requires browser)
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          role: userRole,
        },
        emailRedirectTo: `${window.location.origin}${ROUTES.AUTH.CALLBACK}`,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!authData.user) {
      throw new Error("Failed to create user");
    }

    return {
      success: true,
      userId: authData.user.id,
      message: "Account created. Please check your email to confirm.",
    };
  },

  /**
   * Signin (server-side via API route)
   * Calls /api/auth/signin with email + password
   */
  async signin(data: SigninData): Promise<SigninResponse> {
    const response = await fetch("/api/auth/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to sign in");
    }

    return result;
  },

  /**
   * Signout
   * Clears session cookies
   */
  async signout(): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }
  },

  /**
   * Get current authenticated user
   * Returns null if not authenticated
   */
  async getCurrentUser(): Promise<User | null> {
    const supabase = createClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      isStaff: user.user_metadata?.role === "staff",
    };
  },
};
