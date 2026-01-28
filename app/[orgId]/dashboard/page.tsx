/**
 * Dashboard Page - Organization App
 * Main dashboard for clinic users
 *
 * Note: This fetch is cached by Next.js Request Memoization
 * The layout already fetched this org data, so this is a cache hit
 */

import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/app/dashboard/DashboardView";

interface DashboardPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const user = await getUser();
  const { orgId } = await params;

  // Get organization name
  // ✅ This fetch is cached from layout - no additional DB query
  const supabase = await createClient();
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const firstName = user?.firstName || user?.email?.split("@")[0] || "User";

  return (
    <DashboardView orgId={orgId} userName={firstName} orgName={org?.name} />
  );
}
