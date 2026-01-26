/**
 * Document AI Page - Generic Entry Point
 * Allows users to select a trial and document to start chatting
 */

import { AIAssistantView } from "@/components/app/documentAI/AIAssistantView";

interface DocumentAIPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function DocumentAIPage({ params }: DocumentAIPageProps) {
  const { orgId } = await params;

  // Render with empty trialId and documentId to show EmptyState
  return (
    <AIAssistantView
      orgId={orgId}
      trialId=""
      documentId={undefined}
      activeTab="assistant"
    />
  );
}
