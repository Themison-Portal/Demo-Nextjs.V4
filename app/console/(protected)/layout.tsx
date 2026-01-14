/**
 * Console Protected Layout
 * Server Component that validates staff authentication
 * Redirects to signin if user is not authenticated or not staff
 */

import { requireStaff } from "@/lib/auth/guards";
import { Shell } from "@/components/console/shell/Shell";

export default async function ConsoleProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate staff authentication (auto-redirects if invalid)
  await requireStaff();

  // User is authenticated staff → render with sidebar layout
  return <Shell>{children}</Shell>;
}
