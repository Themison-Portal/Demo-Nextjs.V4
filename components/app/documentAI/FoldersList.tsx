/**
 * Folders List
 * Left column showing user's folders with context menu
 */

"use client";

import { useState } from "react";
import { useArchiveFolders, useDeleteFolder } from "@/hooks/client/useArchive";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Folder,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateFolderModal } from "./CreateFolderModal";

interface FoldersListProps {
  orgId: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
}

export function FoldersList({
  orgId,
  selectedFolderId,
  onSelectFolder,
}: FoldersListProps) {
  const { data: folders = [], isLoading } = useArchiveFolders(orgId);
  const deleteFolder = useDeleteFolder();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const handleDelete = async (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this folder and all its responses?")) return;

    try {
      await deleteFolder.mutateAsync(folderId);
      if (selectedFolderId === folderId) {
        onSelectFolder(folders[0]?.id || "");
      }
    } catch (error) {
      console.error("Failed to delete folder:", error);
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
      <div className="px-3 py-3 border-b border-gray-200 flex items-center justify-between h-12">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Folders
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreatingFolder(true)}
          className="h-7 px-2"
        >
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </div>

      {/* Folders List */}
      <div className="flex-1 overflow-y-auto p-2">
        {folders.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <Folder className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 mb-3">No folders yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingFolder(true)}
            >
              Create your first folder
            </Button>
          </div>
        ) : (
          <div className="space-y-1">
            {folders.map((folder) => (
              <div
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                  selectedFolderId === folder.id
                    ? "bg-blue-50 border border-blue-200"
                    : "hover:bg-gray-50",
                )}
              >
                <Folder
                  className={cn(
                    "h-4 w-4 shrink-0",
                    selectedFolderId === folder.id
                      ? "text-blue-600"
                      : "text-gray-400",
                  )}
                />
                <span
                  className={cn(
                    "flex-1 text-sm truncate",
                    selectedFolderId === folder.id
                      ? "text-gray-900 font-medium"
                      : "text-gray-700",
                  )}
                >
                  {folder.name}
                </span>

                {/* Context Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement rename
                        alert("Rename coming soon");
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => handleDelete(folder.id, e)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      <CreateFolderModal
        orgId={orgId}
        isOpen={isCreatingFolder}
        onClose={() => setIsCreatingFolder(false)}
        onSuccess={(folderId) => {
          setIsCreatingFolder(false);
          onSelectFolder(folderId);
        }}
      />
    </div>
  );
}
