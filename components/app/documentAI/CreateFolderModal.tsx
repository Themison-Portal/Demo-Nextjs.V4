/**
 * Create Folder Modal
 * Simple modal for creating new folder
 */

"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateFolder } from "@/hooks/client/useArchive";

interface CreateFolderModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (folderId: string) => void;
}

export function CreateFolderModal({
  orgId,
  isOpen,
  onClose,
  onSuccess,
}: CreateFolderModalProps) {
  const [folderName, setFolderName] = useState("");
  const createFolder = useCreateFolder();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      const newFolder = await createFolder.mutateAsync({
        org_id: orgId,
        name: folderName.trim(),
      });

      handleClose();
      onSuccess?.(newFolder.id);
    } catch (error) {
      console.error("Failed to create folder:", error);
    }
  };

  const handleClose = () => {
    setFolderName("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={handleClose}>Create Folder</ModalHeader>

        <div className="px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g., Visit 6 Specifications"
              autoFocus
            />
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!folderName.trim() || createFolder.isPending}
          >
            {createFolder.isPending ? "Creating..." : "Create"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
