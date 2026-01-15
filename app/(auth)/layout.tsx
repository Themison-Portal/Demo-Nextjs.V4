/**
 * Auth Layout
 * Public layout for client authentication (signin/signup)
 * Redirects authenticated users to their appropriate dashboard
 */

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  // Not authenticated → allow access to signin/signup
  if (!user) {
    return <>{children}</>;
  }

  // Staff user → redirect to console
  if (user.isStaff) {
    redirect(ROUTES.CONSOLE.HOME);
  }

  // Client user → redirect to their organization dashboard
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (membership?.org_id) {
    redirect(ROUTES.APP.DASHBOARD(membership.org_id));
  }

  // Fallback: user has no organization (shouldn't happen)
  // Sign them out and show signin
  redirect(ROUTES.PUBLIC.ERROR_WITH_MESSAGE("No organization found"));
}
