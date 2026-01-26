/**
 * Modal Documents List
 * Right column - List of documents for selected trial
 */

"use client";

import { useTrialDocuments } from "@/hooks/client/useTrialDocuments";
import { FileText, FileQuestion } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/date";
import {
  DOCUMENT_CATEGORY_OPTIONS,
  DOCUMENT_CATEGORY_STYLES,
} from "@/lib/constants/documents";

interface ModalDocumentsListProps {
  orgId: string;
  trialId: string | null;
  selectedDocumentId: string | null;
  onSelectDocument: (documentId: string) => void;
  onDoubleClick: (documentId: string) => void;
}

export function ModalDocumentsList({
  orgId,
  trialId,
  selectedDocumentId,
  onSelectDocument,
  onDoubleClick,
}: ModalDocumentsListProps) {
  const { documents, isLoading } = useTrialDocuments(
    orgId,
    trialId || ""
  );

  // Filter only ready documents
  const readyDocuments = documents.filter((doc) => doc.status === "ready");

  // Show instructions if no trial selected
  if (!trialId) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center">
        <div className="space-y-2">
          <FileQuestion className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-500">Select a trial to view documents</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 bg-gray-100 animate-pulse rounded"
          />
        ))}
      </div>
    );
  }

  if (readyDocuments.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center">
        <div className="space-y-2">
          <FileText className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-500">No documents available</p>
          <p className="text-xs text-gray-400">
            Documents must be uploaded and processed first
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="space-y-1">
        {readyDocuments.map((document) => {
          const isSelected = selectedDocumentId === document.id;
          const categoryLabel = DOCUMENT_CATEGORY_OPTIONS.find(
            (c) => c.value === document.category
          )?.label;
          const categoryStyle =
            document.category && DOCUMENT_CATEGORY_STYLES[document.category];

          return (
            <button
              key={document.id}
              onClick={() => onSelectDocument(document.id)}
              onDoubleClick={() => onDoubleClick(document.id)}
              className={cn(
                "w-full flex items-start gap-3 px-3 py-3 rounded border-2 transition-all text-left",
                isSelected
                  ? "border-blue-500 bg-blue-50"
                  : "border-transparent hover:bg-gray-50"
              )}
            >
              {/* Icon */}
              <FileText className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {document.file_name}
                  </p>
                  {categoryLabel && categoryStyle && (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full shrink-0",
                        categoryStyle
                      )}
                    >
                      {categoryLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {formatDate(document.created_at)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Document count */}
      <div className="mt-4 px-3">
        <p className="text-xs text-gray-500">
          {readyDocuments.length} {readyDocuments.length === 1 ? "document" : "documents"}
        </p>
      </div>
    </div>
  );
}
