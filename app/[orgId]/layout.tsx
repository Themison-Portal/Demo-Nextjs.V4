/**
 * App Layout - Organization App
 * Protected layout for clinic users
 *
 * Validates organization access using requireOrgAccess guard
 * - Staff users: requires support_enabled = true
 * - Clinic users: requires active membership
 *
 * Note: Fetches are automatically cached by Next.js Request Memoization
 * Pages can safely re-fetch org data without additional DB queries
 */

import { requireOrgAccess } from "@/lib/auth/guards";

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const { orgId } = await params;

  // Validate organization access (auto-redirects if invalid)
  // Fetch is cached - pages can re-fetch without performance penalty
  await requireOrgAccess(orgId);

  return <div className="min-h-screen bg-background">{children}</div>;
}
