/**
 * Document AI Archive Page - Generic Entry Point
 * Shows response archive for all conversations
 */

import { AIAssistantView } from "@/components/app/documentAI/AIAssistantView";

interface DocumentAIArchivePageProps {
  params: Promise<{ orgId: string }>;
}

export default async function DocumentAIArchivePage({
  params,
}: DocumentAIArchivePageProps) {
  const { orgId } = await params;

  return (
    <AIAssistantView
      orgId={orgId}
      trialId=""
      documentId={undefined}
      activeTab="archive"
    />
  );
}
