/**
 * Modal Folders List
 * Left panel showing user's folders (macOS Finder style)
 */

"use client";

import { useState } from "react";
import { useArchiveFolders, useCreateFolder } from "@/hooks/client/useArchive";
import { NewFolderInput } from "./NewFolderInput";
import { Folder, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalFoldersListProps {
  orgId: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
}

export function ModalFoldersList({
  orgId,
  selectedFolderId,
  onSelectFolder,
}: ModalFoldersListProps) {
  const { data: folders = [], isLoading } = useArchiveFolders(orgId);
  const createFolder = useCreateFolder();
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const handleCreateFolder = async (name: string) => {
    try {
      const newFolder = await createFolder.mutateAsync({
        org_id: orgId,
        name,
      });
      setIsCreatingNew(false);
      onSelectFolder(newFolder.id); // Auto-select new folder
    } catch (error) {
      console.error("Failed to create folder:", error);
      setIsCreatingNew(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase">
          Folders
        </h3>
        <button
          onClick={() => setIsCreatingNew(true)}
          disabled={isCreatingNew}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="New Folder"
        >
          <Plus className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto">
        {/* New folder input (if creating) */}
        {isCreatingNew && (
          <NewFolderInput
            onSave={handleCreateFolder}
            onCancel={() => setIsCreatingNew(false)}
          />
        )}

        {/* Existing folders */}
        {folders.length === 0 && !isCreatingNew ? (
          <div className="px-3 py-8 text-center">
            <Folder className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">No folders yet</p>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Create your first folder
            </button>
          </div>
        ) : (
          folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "w-full px-3 py-2 flex items-center gap-2 text-left transition-colors",
                selectedFolderId === folder.id
                  ? "bg-blue-50 border-l-2 border-blue-500"
                  : "hover:bg-gray-50",
              )}
            >
              <Folder
                className={cn(
                  "w-4 h-4 shrink-0",
                  selectedFolderId === folder.id
                    ? "text-blue-600"
                    : "text-gray-400",
                )}
              />
              <span
                className={cn(
                  "text-sm truncate",
                  selectedFolderId === folder.id
                    ? "text-gray-900 font-medium"
                    : "text-gray-700",
                )}
              >
                {folder.name}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
