"use client";

import { useState, useRef } from "react";
import { useTrialDocuments } from "@/hooks/client/useTrialDocuments";
import { Upload, FileText, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/date";
import type { DocumentStatus } from "@/services/documents";

interface DocumentsListProps {
  orgId: string;
  trialId: string;
}

export function DocumentsList({ orgId, trialId }: DocumentsListProps) {
  const { documents, isLoading, uploadDocument, isUploading, uploadError } =
    useTrialDocuments(orgId, trialId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadDocument(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="h-6 w-32 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-gray-900">Trial Documents</h2>
            <span className="text-sm text-gray-500">
              {documents.length} {documents.length === 1 ? "document" : "documents"}
            </span>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="block text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              file:cursor-pointer"
          />
          {selectedFile && (
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload
                </>
              )}
            </button>
          )}
        </div>
        {uploadError && (
          <p className="mt-2 text-sm text-red-600">
            {uploadError instanceof Error ? uploadError.message : "Upload failed"}
          </p>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Only PDF files up to 50MB are supported
        </p>
      </div>

      {/* Documents List */}
      <div className="divide-y divide-gray-100">
        {documents.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p>No documents uploaded yet.</p>
            <p className="text-sm mt-1">Upload a protocol or other trial documents to get started.</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.id}
              className="px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {doc.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.file_size)}
                      </p>
                      <span className="text-gray-300">•</span>
                      <p className="text-xs text-gray-500">
                        {formatDate(doc.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.status} error={doc.processing_error} />
                  {doc.status === "ready" && (
                    <a
                      href={doc.storage_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      View PDF
                    </a>
                  )}
                </div>
              </div>
              {doc.status === "error" && doc.processing_error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {doc.processing_error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper: Status Badge Component
function StatusBadge({ status, error }: { status: DocumentStatus; error?: string | null }) {
  const config = {
    uploading: {
      icon: Clock,
      label: "Uploading",
      className: "bg-gray-100 text-gray-700",
    },
    processing: {
      icon: Clock,
      label: "Processing",
      className: "bg-yellow-100 text-yellow-700",
    },
    ready: {
      icon: CheckCircle,
      label: "Ready",
      className: "bg-green-100 text-green-700",
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      className: "bg-red-100 text-red-700",
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${className}`}
      title={error || undefined}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
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
