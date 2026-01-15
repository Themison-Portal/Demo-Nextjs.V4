/**
 * Dashboard Page - Organization App
 * Main dashboard for clinic users
 *
 * Note: This fetch is cached by Next.js Request Memoization
 * The layout already fetched this org data, so this is a cache hit (0 DB queries)
 */

import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";
import { SignoutButton } from "@/components/auth/SignoutButton";

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

  const firstName = user?.firstName || user?.email.split("@")[0];

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Welcome, {firstName}!</h1>
        {org && <p className="text-xl text-muted-foreground">{org.name}</p>}
        <p className="text-lg text-muted-foreground">
          Dashboard under development
        </p>
        <div className="pt-4">
          <SignoutButton />
        </div>
      </div>
    </div>
  );
}
