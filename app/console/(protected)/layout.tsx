/**
 * Console Protected Layout
 * Server Component that validates staff authentication
 * Redirects to signin if user is not authenticated or not staff
 */

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";

export default async function ConsoleProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate JWT and get user (server-side)
  const user = await getUser();

  // Redirect if not authenticated or not staff
  if (!user || !user.isStaff) {
    redirect("/console/signin");
  }

  // User is authenticated staff → render children
  return <>{children}</>;
}
