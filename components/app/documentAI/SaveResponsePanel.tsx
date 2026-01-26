/**
 * Save Response Panel
 * Right panel for saving response to folder
 */

"use client";

import { useState } from "react";
import { useSavedResponses } from "@/hooks/client/useArchive";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SaveResponsePanelProps {
  folderId: string | null;
  responseTitle: string;
  onTitleChange: (title: string) => void;
}

export function SaveResponsePanel({
  folderId,
  responseTitle,
  onTitleChange,
}: SaveResponsePanelProps) {
  const { data: savedResponses = [], isLoading } = useSavedResponses(folderId);

  // No folder selected
  if (!folderId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 space-y-2">
          <FileText className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm">Select or create a folder</p>
        </div>
      </div>
    );
  }

  // Loading saved responses
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      {/* Saved Responses (if any) */}
      {savedResponses.length > 0 && (
        <div className="flex-1 overflow-y-auto space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
            Saved in this folder
          </h4>
          {savedResponses.map((response) => (
            <div
              key={response.id}
              className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
            >
              <p className="text-sm font-medium text-gray-900 truncate">
                {response.title}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDistanceToNow(new Date(response.created_at), {
                  addSuffix: true,
                })}
              </p>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-4 mt-4" />
        </div>
      )}

      {/* New Response Form */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="response-title" className="text-sm text-gray-700">
            Response Title
          </Label>
          <Input
            id="response-title"
            value={responseTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Enter a title for this response..."
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
}
