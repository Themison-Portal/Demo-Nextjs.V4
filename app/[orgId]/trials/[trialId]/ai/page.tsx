/**
 * AI Assistant Page - Document Q&A
 * RAG-powered assistant for trial documents
 */

import { AIAssistantView } from "@/components/app/trials/ai/AIAssistantView";

interface AIAssistantPageProps {
  params: Promise<{ orgId: string; trialId: string }>;
  searchParams: Promise<{ documentId?: string }>;
}

export default async function AIAssistantPage({
  params,
  searchParams,
}: AIAssistantPageProps) {
  const { orgId, trialId } = await params;
  const { documentId } = await searchParams;

  return (
    <AIAssistantView
      orgId={orgId}
      trialId={trialId}
      documentId={documentId}
      activeTab="assistant"
    />
  );
}
