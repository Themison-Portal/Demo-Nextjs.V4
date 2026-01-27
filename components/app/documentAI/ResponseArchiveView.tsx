/**
 * Response Archive View
 * 3-column Finder-style layout for browsing saved responses
 */

"use client";

import { useState } from "react";
import { FoldersList } from "./FoldersList";
import { ResponsesList } from "./ResponsesList";
import { ResponseViewer } from "./ResponseViewer";
import type { SavedResponse } from "@/types/archive";

interface ResponseArchiveViewProps {
  orgId: string;
}

export function ResponseArchiveView({ orgId }: ResponseArchiveViewProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<SavedResponse | null>(
    null,
  );

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
    setSelectedResponse(null); // Reset response selection when folder changes
  };

  const handleResponseSelect = (response: SavedResponse) => {
    setSelectedResponse(response);
  };

  return (
    <div className="flex h-[calc(100vh-280px)] bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Left Column: Folders */}
      <div className="w-64 border-r border-gray-200 overflow-y-auto">
        <FoldersList
          orgId={orgId}
          selectedFolderId={selectedFolderId}
          onSelectFolder={handleFolderSelect}
        />
      </div>

      {/* Middle Column: Responses */}
      <div className="w-80 border-r border-gray-200 overflow-y-auto">
        <ResponsesList
          folderId={selectedFolderId}
          selectedResponseId={selectedResponse?.id || null}
          onSelectResponse={handleResponseSelect}
          orgId={orgId}
        />
      </div>

      {/* Right Column: Viewer */}
      <div className="flex-1 overflow-y-auto">
        <ResponseViewer response={selectedResponse} />
      </div>
    </div>
  );
}
