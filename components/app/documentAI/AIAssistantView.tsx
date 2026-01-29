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
  chatId?: string; // Optional chat ID to load existing chat
  activeTab?: ValidTab;
}

export function AIAssistantView({
  orgId,
  trialId,
  documentId,
  chatId,
  activeTab = "assistant",
}: AIAssistantViewProps) {
  const router = useRouter();
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const handleDocumentSelect = (
    selectedTrialId: string,
    selectedDocumentId: string,
  ) => {
    // Navigate to AI page with selected document (no chatId = new chat)
    router.push(
      ROUTES.APP.DOCUMENT_AI_CHAT(orgId, selectedTrialId, selectedDocumentId),
    );
    setIsSelectorOpen(false);
  };

  const handleChatCreated = (newChatId: string) => {
    // Update URL with new chat ID
    if (documentId && trialId) {
      router.replace(
        ROUTES.APP.DOCUMENT_AI_CHAT(orgId, trialId, documentId, newChatId),
      );
    }
  };

  // Tabs configuration - Preserve chatId when navigating between tabs
  const tabs: TabItem[] = [
    {
      label: "AI Assistant",
      value: "assistant",
      href:
        trialId && documentId
          ? ROUTES.APP.DOCUMENT_AI_CHAT(orgId, trialId, documentId, chatId)
          : ROUTES.APP.DOCUMENT_AI(orgId),
      icon: <Bot className="h-4 w-4" />,
    },
    {
      label: "Response Archive",
      value: "archive",
      href:
        trialId && documentId
          ? ROUTES.APP.DOCUMENT_AI_ARCHIVE_CHAT(
              orgId,
              trialId,
              documentId,
              chatId,
            )
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
            chatId={chatId}
            onChangeDocument={() => setIsSelectorOpen(true)}
            onChatCreated={handleChatCreated}
          />
        );
      case "archive":
        return <ResponseArchiveView orgId={orgId} trialId={trialId} />;
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
