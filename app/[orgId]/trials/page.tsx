/**
 * Trials Page - Organization App
 * List of trials for clinic users
 */

import { TrialsList } from "@/components/app/trials/TrialsList";

interface TrialsPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function TrialsPage({ params }: TrialsPageProps) {
  const { orgId } = await params;

  return <TrialsList orgId={orgId} />;
}
