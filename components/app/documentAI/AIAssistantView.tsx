/**
 * AI Assistant View
 * Main container for document Q&A with RAG
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  NavigationTabs,
  TabItem,
} from "@/components/app/shared/NavigationTabs";
import { EmptyState } from "./EmptyState";
import { ChatInterface } from "./ChatInterface";
import { DocumentSelectorModal } from "./DocumentSelectorModal";
import { ResponseArchiveView } from "./ResponseArchiveView";
import { ROUTES } from "@/lib/routes";
import { Bot, Archive } from "lucide-react";

type ValidTab = "assistant" | "archive";

interface AIAssistantViewProps {
  orgId: string;
  trialId: string;
  documentId?: string;
  activeTab?: ValidTab;
}

export function AIAssistantView({
  orgId,
  trialId,
  documentId,
  activeTab = "assistant",
}: AIAssistantViewProps) {
  const router = useRouter();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const handleDocumentSelect = (
    selectedTrialId: string,
    selectedDocumentId: string,
  ) => {
    // Navigate to AI page with selected document
    router.push(
      ROUTES.APP.AI_ASSISTANT(orgId, selectedTrialId, selectedDocumentId),
    );
    setIsSelectorOpen(false);
  };

  // Tabs configuration
  const tabs: TabItem[] = [
    {
      label: "AI Assistant",
      value: "assistant",
      href: trialId
        ? documentId
          ? ROUTES.APP.AI_ASSISTANT(orgId, trialId, documentId)
          : `/${orgId}/trials/${trialId}/ai`
        : ROUTES.APP.DOCUMENT_AI(orgId),
      icon: <Bot className="h-4 w-4" />,
    },
    {
      label: "Response Archive",
      value: "archive",
      href: trialId
        ? documentId
          ? ROUTES.APP.AI_ASSISTANT_ARCHIVE(orgId, trialId, documentId)
          : `/${orgId}/trials/${trialId}/ai/archive`
        : ROUTES.APP.DOCUMENT_AI_ARCHIVE(orgId),
      icon: <Archive className="h-4 w-4" />,
    },
  ];

  // BackLink logic
  const backLink = trialId
    ? {
        label: "Back to Trial",
        href: ROUTES.APP.TRIAL_TAB(orgId, trialId, "documentation"),
      }
    : {
        label: "Dashboard",
        href: ROUTES.APP.DASHBOARD(orgId),
      };

  const renderContent = () => {
    switch (activeTab) {
      case "assistant":
        return !documentId ? (
          <EmptyState onSelectDocument={() => setIsSelectorOpen(true)} />
        ) : (
          <ChatInterface
            orgId={orgId}
            trialId={trialId}
            documentId={documentId}
            onChangeDocument={() => setIsSelectorOpen(true)}
          />
        );
      case "archive":
        return <ResponseArchiveView orgId={orgId} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <NavigationTabs tabs={tabs} backLink={backLink} />

      {/* Content Area */}
      <div className="animate-in fade-in duration-300">{renderContent()}</div>

      {/* Document Selector Modal */}
      <DocumentSelectorModal
        orgId={orgId}
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelect={handleDocumentSelect}
      />
    </div>
  );
}
