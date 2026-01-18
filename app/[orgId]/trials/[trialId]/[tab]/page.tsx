/**
 * Trial Tab Page - Organization App
 * Renders the trial view with the active tab
 */

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import { TrialView } from "@/components/app/trials/TrialView";

const VALID_TABS = ["overview", "documentation", "team", "patients"] as const;
type ValidTab = (typeof VALID_TABS)[number];

interface TrialTabPageProps {
  params: Promise<{ orgId: string; trialId: string; tab: string }>;
}

export default async function TrialTabPage({ params }: TrialTabPageProps) {
  const { orgId, trialId, tab } = await params;

  // Validate tab
  if (!VALID_TABS.includes(tab as ValidTab)) {
    redirect(ROUTES.APP.TRIAL_TAB(orgId, trialId, "overview"));
  }

  return <TrialView orgId={orgId} trialId={trialId} activeTab={tab as ValidTab} />;
}
