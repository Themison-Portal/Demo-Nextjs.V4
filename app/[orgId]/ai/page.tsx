/**
 * Document AI Page - Generic Entry Point
 * Allows users to select a trial and document to start chatting
 */

import { AIAssistantView } from "@/components/app/documentAI/AIAssistantView";

interface DocumentAIPageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{
    trialId?: string;
    documentId?: string;
    chatId?: string;
  }>;
}

export default async function DocumentAIPage({
  params,
  searchParams,
}: DocumentAIPageProps) {
  const { orgId } = await params;
  const { trialId, documentId, chatId } = await searchParams;

  // Render with query params or empty to show EmptyState
  return (
    <AIAssistantView
      orgId={orgId}
      trialId={trialId || ""}
      documentId={documentId}
      chatId={chatId}
      activeTab="assistant"
    />
  );
}
