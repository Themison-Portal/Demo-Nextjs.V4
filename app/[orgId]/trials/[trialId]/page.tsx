/**
 * Trial Detail Page - Organization App
 * Redirects to overview tab
 */

import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface TrialDetailPageProps {
  params: Promise<{ orgId: string; trialId: string }>;
}

export default async function TrialDetailPage({ params }: TrialDetailPageProps) {
  const { orgId, trialId } = await params;

  redirect(ROUTES.APP.TRIAL_TAB(orgId, trialId, "overview"));
}
