/**
 * Document AI Archive Page - Generic Entry Point
 * Shows response archive for all conversations
 */

import { AIAssistantView } from "@/components/app/documentAI/AIAssistantView";

interface DocumentAIArchivePageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{
    trialId?: string;
    documentId?: string;
    chatId?: string;
  }>;
}

export default async function DocumentAIArchivePage({
  params,
  searchParams,
}: DocumentAIArchivePageProps) {
  const { orgId } = await params;
  const { trialId, documentId, chatId } = await searchParams;

  return (
    <AIAssistantView
      orgId={orgId}
      trialId={trialId || ""}
      documentId={documentId}
      chatId={chatId}
      activeTab="archive"
    />
  );
}
