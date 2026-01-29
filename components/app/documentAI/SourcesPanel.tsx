/**
 * Sources Panel - Sidebar showing document sources/citations
 * Displays list of sources with page numbers and sections
 * Allows navigation to PDF viewer with highlights
 */

"use client";

import { X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RagSource } from "@/services/rag/types";

interface SourcesPanelProps {
  sources: RagSource[];
  isOpen: boolean;
  onClose: () => void;
  onSourceClick: (source: RagSource, index: number) => void;
  selectedSourceIndex?: number;
}

export function SourcesPanel({
  sources,
  isOpen,
  onClose,
  onSourceClick,
  selectedSourceIndex,
}: SourcesPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-white border-l border-gray-200 z-50 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Sources</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close sources panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sources List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {sources.length === 0 ? (
            <div className="text-center text-gray-500 text-sm mt-8">
              No sources available
            </div>
          ) : (
            sources.map((source, index) => (
              <button
                key={index}
                onClick={() => onSourceClick(source, index)}
                className={cn(
                  "w-full text-left p-3 rounded-lg border transition-colors",
                  selectedSourceIndex === index
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                {/* Source Header */}
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-gray-400" />
                      <p className="text-xs font-medium text-gray-900 truncate">
                        {source.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Page {source.page} • {source.section}
                    </p>
                  </div>
                </div>

                {/* Excerpt */}
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {source.exactText}
                </p>

                {/* Relevance Badge */}
                <div className="mt-2">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 text-[10px] font-medium rounded-full",
                      source.relevance === "high" &&
                        "bg-green-100 text-green-700",
                      source.relevance === "medium" &&
                        "bg-yellow-100 text-yellow-700",
                      source.relevance === "low" && "bg-gray-100 text-gray-600"
                    )}
                  >
                    {source.relevance}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </>
  );
}
