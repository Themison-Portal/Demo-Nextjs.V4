/**
 * Get User Utility
 * Server-side utility to get authenticated user
 * ALWAYS validates JWT against Supabase (secure)
 */

import { createClient } from "@/lib/supabase/server";

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isStaff: boolean;
}

/**
 * Get authenticated user from request
 * Returns null if not authenticated
 * IMPORTANT: This validates the JWT every time (secure)
 *
 * Note: isStaff comes from user_metadata.role in JWT (no extra query needed)
 */
export async function getUser(): Promise<AuthUser | null> {
  const supabase = await createClient();

  // ALWAYS use getUser() not getSession()
  // getUser() validates JWT against Supabase
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
}
