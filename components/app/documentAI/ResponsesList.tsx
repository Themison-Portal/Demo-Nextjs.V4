/**
 * Responses List
 * Middle column showing saved responses in selected folder
 */

"use client";

import {
  useSavedResponses,
  useDeleteSavedResponse,
} from "@/hooks/client/useArchive";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  MoreVertical,
  Trash2,
  Send,
  Download,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type { SavedResponse } from "@/types/archive";

interface ResponsesListProps {
  folderId: string | null;
  selectedResponseId: string | null;
  onSelectResponse: (response: SavedResponse) => void;
}

export function ResponsesList({
  folderId,
  selectedResponseId,
  onSelectResponse,
}: ResponsesListProps) {
  const { data: responses = [], isLoading } = useSavedResponses(folderId);
  const deleteResponse = useDeleteSavedResponse();

  const handleDelete = async (responseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this response?")) return;

    try {
      await deleteResponse.mutateAsync(responseId);
    } catch (error) {
      console.error("Failed to delete response:", error);
    }
  };

  // No folder selected
  if (!folderId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 space-y-2 px-4">
          <FileText className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm">Select a folder to view responses</p>
        </div>
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  // Empty state
  if (responses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 space-y-2 px-4">
          <FileText className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm">No saved responses in this folder</p>
          <p className="text-xs text-gray-400">
            Save responses from the AI Assistant to see them here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col ">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 h-12 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Saved Responses ({responses.length})
        </h3>
      </div>

      {/* Responses List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {responses.map((response) => (
            <div
              key={response.id}
              onClick={() => onSelectResponse(response)}
              className={cn(
                "group flex flex-col gap-1 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                selectedResponseId === response.id
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-gray-50 border border-transparent",
              )}
            >
              {/* Title and Menu */}
              <div className="flex items-start justify-between gap-2">
                <h4
                  className={cn(
                    "text-sm font-medium line-clamp-2 flex-1",
                    selectedResponseId === response.id
                      ? "text-gray-900"
                      : "text-gray-700",
                  )}
                >
                  {response.title}
                </h4>

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
                        // TODO: Implement send
                        alert("Send coming soon");
                      }}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement export
                        alert("Export coming soon");
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => handleDelete(response.id, e)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Preview */}
              <p className="text-xs text-gray-500 line-clamp-2">
                {response.question}
              </p>

              {/* Date */}
              <p className="text-xs text-gray-400">
                {formatDistanceToNow(new Date(response.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
