"use client";

import { useState } from "react";
import Link from "next/link";
import { useTrialDocuments } from "@/hooks/client/useTrialDocuments";
import { useTrialPermissions } from "@/hooks/useTrialPermissions";
import { useTrialDetails } from "@/hooks/client/useTrialDetails";
import { FileText, Plus, Bot } from "lucide-react";
import { UploadDocumentModal } from "./UploadDocumentModal";
import { DocumentSidebar } from "./DocumentSidebar";
import { formatDate } from "@/lib/date";
import {
  DOCUMENT_CATEGORY_OPTIONS,
  DOCUMENT_CATEGORY_STYLES,
} from "@/lib/constants/documents";
import { ROUTES } from "@/lib/routes";
import type { TrialDocument } from "@/services/documents";

interface DocumentsListProps {
  orgId: string;
  trialId: string;
}

export function DocumentsList({ orgId, trialId }: DocumentsListProps) {
  const {
    documents,
    isLoading,
    uploadDocument,
    isUploading,
    updateCategory,
    isUpdatingCategory,
  } = useTrialDocuments(orgId, trialId);
  const { teamMembers } = useTrialDetails(orgId, trialId);
  const { canManagePatients } = useTrialPermissions(orgId, teamMembers);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null,
  );
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);

  // Find the selected document from the current documents list (always fresh data)
  const selectedDocument = selectedDocumentId
    ? documents.find((d) => d.id === selectedDocumentId) || null
    : null;

  const handleUpload = async (file: File, category: string) => {
    await uploadDocument({ file, category });
    setIsUploadModalOpen(false);
  };

  const handleSelectDocument = (doc: TrialDocument) => {
    // Toggle selection
    if (selectedDocumentId === doc.id) {
      setSelectedDocumentId(null);
    } else {
      setSelectedDocumentId(doc.id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-sm border border-gray-200">
        <div className="p-6">
          <div className="h-6 w-32 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="border-t border-gray-200">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="h-10 w-10 bg-gray-100 animate-pulse rounded-lg" />
              <div className="flex-1">
                <div className="h-4 w-48 bg-gray-100 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-auto">
      {/* Left: Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
              <span className="text-sm text-gray-500">
                {documents.length}{" "}
                {documents.length === 1 ? "document" : "documents"}
              </span>
            </div>
            {canManagePatients && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Upload Document
              </button>
            )}
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-4">File Name</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Uploaded</div>
          <div className="col-span-1"></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {documents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No documents yet. Upload documents to get started.
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onMouseEnter={() => setHoveredRowId(doc.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                onClick={() => handleSelectDocument(doc)}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-colors ${
                  selectedDocumentId === doc.id
                    ? "bg-blue-50 hover:bg-blue-100"
                    : "hover:bg-gray-50"
                }`}
              >
                {/* File Name */}
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                    <FileText className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.file_name}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  {doc.category && (
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        DOCUMENT_CATEGORY_STYLES[doc.category]
                      }`}
                    >
                      {
                        DOCUMENT_CATEGORY_OPTIONS.find(
                          (c) => c.value === doc.category,
                        )?.label
                      }
                    </span>
                  )}
                </div>

                {/* Size */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">
                    {formatFileSize(doc.file_size)}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      doc.status === "ready"
                        ? "bg-green-100 text-green-700"
                        : doc.status === "processing"
                          ? "bg-yellow-100 text-yellow-700"
                          : doc.status === "error"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {doc.status}
                  </span>
                </div>

                {/* Uploaded */}
                <div className="col-span-1">
                  <p className="text-sm text-gray-600">
                    {formatDate(doc.created_at)}
                  </p>
                </div>

                {/* AI Button */}
                <div className="col-span-1 flex justify-end">
                  {hoveredRowId === doc.id && doc.status === "ready" && (
                    <Link
                      href={ROUTES.APP.AI_ASSISTANT(orgId, trialId, doc.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-blue-100 text-blue-600 transition-colors"
                      aria-label="Ask AI Assistant"
                    >
                      <Bot className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Sidebar (conditional) */}
      {selectedDocument && (
        <DocumentSidebar
          orgId={orgId}
          trialId={trialId}
          document={selectedDocument}
          onUpdateCategory={updateCategory}
          isUpdating={isUpdatingCategory}
        />
      )}

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSubmit={handleUpload}
        isLoading={isUploading}
      />
    </div>
  );
}

// Helper: Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}
