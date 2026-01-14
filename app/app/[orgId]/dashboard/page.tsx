/**
 * Dashboard Page - Organization App
 * Main dashboard for clinic users
 */

import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";

interface DashboardPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const user = await getUser();
  const { orgId } = await params;

  // Get organization name
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
        <h1 className="text-4xl font-bold">
          Welcome, {firstName}!
        </h1>
        {org && (
          <p className="text-xl text-muted-foreground">
            {org.name}
          </p>
        )}
        <p className="text-lg text-muted-foreground">
          Dashboard under development
        </p>
      </div>
    </div>
  );
}
