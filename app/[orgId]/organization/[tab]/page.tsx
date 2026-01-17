/**
 * Organization Tab Page
 * Renders the appropriate view based on active tab
 */

import { notFound } from "next/navigation";
import { OrganizationView } from "@/components/app/organization/OrganizationView";

const VALID_TABS = ["overview", "members", "settings"] as const;
type ValidTab = (typeof VALID_TABS)[number];

interface OrganizationTabPageProps {
  params: Promise<{ orgId: string; tab: string }>;
}

export default async function OrganizationTabPage({
  params,
}: OrganizationTabPageProps) {
  const { orgId, tab } = await params;

  if (!VALID_TABS.includes(tab as ValidTab)) {
    notFound();
  }

  return <OrganizationView orgId={orgId} activeTab={tab as ValidTab} />;
}
