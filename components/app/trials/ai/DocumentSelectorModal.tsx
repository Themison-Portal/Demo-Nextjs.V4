/**
 * Document Selector Modal
 * Finder-style modal for selecting trial and document
 */

"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ModalTrialsList } from "./ModalTrialsList";
import { ModalDocumentsList } from "./ModalDocumentsList";

interface DocumentSelectorModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (trialId: string, documentId: string) => void;
}

export function DocumentSelectorModal({
  orgId,
  isOpen,
  onClose,
  onSelect,
}: DocumentSelectorModalProps) {
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );

  const handleConfirm = () => {
    if (selectedTrialId && selectedDocumentId) {
      onSelect(selectedTrialId, selectedDocumentId);
      handleClose();
    }
  };

  const handleDocumentDoubleClick = (documentId: string) => {
    if (selectedTrialId) {
      onSelect(selectedTrialId, documentId);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedTrialId(null);
    setSelectedDocumentId(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-4xl h-[600px] flex flex-col"
    >
      {/* Header */}
      <ModalHeader onClose={handleClose}>Select Document</ModalHeader>

      {/* Two columns - Finder style */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Trials */}
        <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
          <ModalTrialsList
            orgId={orgId}
            selectedTrialId={selectedTrialId}
            onSelectTrial={(trialId) => {
              setSelectedTrialId(trialId);
              setSelectedDocumentId(null); // Reset document selection
            }}
          />
        </div>

        {/* Right: Documents */}
        <div className="flex-1 overflow-y-auto">
          <ModalDocumentsList
            orgId={orgId}
            trialId={selectedTrialId}
            selectedDocumentId={selectedDocumentId}
            onSelectDocument={setSelectedDocumentId}
            onDoubleClick={handleDocumentDoubleClick}
          />
        </div>
      </div>

      {/* Footer */}
      <ModalFooter>
        <Button variant="outline" onClick={handleClose}>
          Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedDocumentId}>
          Select
        </Button>
      </ModalFooter>
    </Modal>
  );
}
