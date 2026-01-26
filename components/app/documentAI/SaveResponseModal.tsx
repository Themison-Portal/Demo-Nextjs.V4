/**
 * Save Response Modal
 * Finder-style modal for saving AI response to folder
 */

"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ModalFoldersList } from "./ModalFoldersList";
import { SaveResponsePanel } from "./SaveResponsePanel";
import { useCreateSavedResponse } from "@/hooks/client/useArchive";

interface SaveResponseModalProps {
  orgId: string;
  trialId: string;
  documentId: string;
  question: string;
  answer: string;
  rawData?: {
    question: Record<string, any>;
    answer: Record<string, any>;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SaveResponseModal({
  orgId,
  trialId,
  documentId,
  question,
  answer,
  rawData,
  isOpen,
  onClose,
  onSuccess,
}: SaveResponseModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [responseTitle, setResponseTitle] = useState("");
  const createSavedResponse = useCreateSavedResponse();

  const handleSave = async () => {
    if (!selectedFolderId || !responseTitle.trim()) return;

    try {
      const input = {
        folder_id: selectedFolderId,
        trial_id: trialId,
        org_id: orgId,
        title: responseTitle.trim(),
        question,
        answer,
        raw_data: rawData,
        document_id: documentId,
      };

      console.log("Saving response with input:", input);

      await createSavedResponse.mutateAsync(input);

      handleClose();
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save response:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
  };

  const handleClose = () => {
    setSelectedFolderId(null);
    setResponseTitle("");
    onClose();
  };

  const canSave = selectedFolderId && responseTitle.trim();

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-4xl h-[600px] flex flex-col"
    >
      {/* Header */}
      <ModalHeader onClose={handleClose}>Save Response</ModalHeader>

      {/* Two columns - Finder style */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Folders */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <ModalFoldersList
            orgId={orgId}
            selectedFolderId={selectedFolderId}
            onSelectFolder={(folderId) => {
              setSelectedFolderId(folderId);
              // Generate default title from question if empty
              if (!responseTitle) {
                const defaultTitle =
                  question.slice(0, 50) + (question.length > 50 ? "..." : "");
                setResponseTitle(defaultTitle);
              }
            }}
          />
        </div>

        {/* Right: Save Form */}
        <div className="flex-1 overflow-y-auto">
          <SaveResponsePanel
            folderId={selectedFolderId}
            responseTitle={responseTitle}
            onTitleChange={setResponseTitle}
          />
        </div>
      </div>

      {/* Footer */}
      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!canSave || createSavedResponse.isPending}
        >
          {createSavedResponse.isPending ? "Saving..." : "Save here"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
