/**
 * AI Assistant Archive Page - Response History
 * Shows saved conversations and responses
 */

import { AIAssistantView } from "@/components/app/documentAI/AIAssistantView";

interface AIAssistantArchivePageProps {
  params: Promise<{ orgId: string; trialId: string }>;
  searchParams: Promise<{ documentId?: string }>;
}

export default async function AIAssistantArchivePage({
  params,
  searchParams,
}: AIAssistantArchivePageProps) {
  const { orgId, trialId } = await params;
  const { documentId } = await searchParams;

  return (
    <AIAssistantView
      orgId={orgId}
      trialId={trialId}
      documentId={documentId}
      activeTab="archive"
    />
  );
}
