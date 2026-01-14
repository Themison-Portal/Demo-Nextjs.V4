/**
 * App Layout - Organization App
 * Protected layout for clinic users
 */

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/getUser";
import { createClient } from "@/lib/supabase/server";

interface AppLayoutProps {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}

export default async function AppLayout({ children, params }: AppLayoutProps) {
  const user = await getUser();
  const { orgId } = await params;

  if (!user) {
    redirect("/console/signin");
  }

  const supabase = await createClient();
  const isStaff = user.email.endsWith("@themison.com");

  if (isStaff) {
    // Staff can only access if organization has support enabled
    const { data: org } = await supabase
      .from("organizations")
      .select("support_enabled")
      .eq("id", orgId)
      .is("deleted_at", null)
      .single();

    if (!org) {
      redirect("/error?message=Organization+not+found");
    }

    if (!org.support_enabled) {
      redirect("/error?message=Support+not+enabled+for+this+organization");
    }
  } else {
    // Clinic users: validate they belong to this organization
    const { data: membership } = await supabase
      .from("organization_members")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .single();

    if (!membership) {
      redirect("/error?message=Unauthorized");
    }
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
