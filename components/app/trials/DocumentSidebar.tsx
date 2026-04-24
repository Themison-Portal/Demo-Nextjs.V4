/**
 * Document Sidebar Component
 * Sidebar panel showing document details
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FileText,
  Download,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import { formatDate } from "@/lib/date";
import { DOCUMENT_CATEGORY_OPTIONS } from "@/lib/constants/documents";
import { ROUTES } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { useDocumentDownloadUrl } from "@/hooks/client/useDocumentDownloadUrl";
import type { TrialDocument } from "@/services/documents";
import type { DocumentProcessingStatus } from "@/services/documents";

interface DocumentSidebarProps {
  orgId: string;
  trialId: string;
  document: TrialDocument;
  onUpdateCategory: (params: {
    documentId: string;
    category: string;
  }) => Promise<any>;
  isUpdating: boolean;
  processingStatus?: DocumentProcessingStatus;
}

export function DocumentSidebar({
  orgId,
  trialId,
  document,
  onUpdateCategory,
  isUpdating,
  processingStatus,
}: DocumentSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState(
    document.category || "",
  );

  // Fetch a fresh signed URL for the View/Download buttons. Disabled until
  // the document is in a viewable state (the buttons themselves only render
  // when status === "ready", but the hook caches across mounts so loading
  // here is essentially zero-cost).
  const { data: downloadUrl, isLoading: isLoadingUrl } = useDocumentDownloadUrl(
    document.id,
    document.status === "ready",
  );
  const fileUrl = downloadUrl?.url;

  const categoryLabel =
    DOCUMENT_CATEGORY_OPTIONS.find((c) => c.value === document.category)
      ?.label || document.category;

  const handleCategoryChange = async (newCategory: string) => {
    if (newCategory === document.category) return;

    setSelectedCategory(newCategory);
    try {
      await onUpdateCategory({
        documentId: document.id,
        category: newCategory,
      });
    } catch (error) {
      console.error("Failed to update category:", error);
      setSelectedCategory(document.category || "");
    }
  };

  const statusConfig = {
    uploading: {
      icon: Clock,
      label: "Uploading...",
      color: "text-gray-500",
    },
    processing: {
      icon: Loader2,
      label: "Analyzing with AI...",
      color: "text-amber-600",
    },
    ready: {
      icon: CheckCircle,
      label: "Ready",
      color: "text-green-600",
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      color: "text-red-600",
    },
  };

  const status = statusConfig[document.status];
  const StatusIcon = status.icon;
  const isProcessing = document.status === "processing";

  return (
    <Card className="sticky top-6 w-80 h-auto shrink-0 rounded-xl">
      <CardContent className="px-4 space-y-4">
        {/* Header with icon */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {document.file_name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(document.file_size)}
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Status
          </label>
          <div className={`flex items-center gap-2 ${status.color}`}>
            <StatusIcon className={cn("h-4 w-4", isProcessing && "animate-spin")} />
            <span className="text-sm font-medium">{status.label}</span>
          </div>
          {isProcessing && processingStatus && (
            <div className="mt-2 space-y-1">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-amber-500 h-1.5 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${processingStatus.progress || 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {Math.round(processingStatus.progress || 0)}%
              </p>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Category
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                disabled={isUpdating}
              >
                <span className="truncate">
                  {categoryLabel || "Select category"}
                </span>
                <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-1" align="start">
              {DOCUMENT_CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => handleCategoryChange(cat.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                    selectedCategory === cat.value && "bg-gray-50",
                  )}
                >
                  <span>{cat.label}</span>
                  {selectedCategory === cat.value && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>

        {/* Upload Date */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Uploaded
          </label>
          <p className="text-sm text-gray-700">
            {formatDate(document.created_at)}
          </p>
        </div>

        {/* Error Message */}
        {document.status === "error" && document.processing_error && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 uppercase">
              Error Details
            </label>
            <p className="text-sm text-red-600">{document.processing_error}</p>
          </div>
        )}

        {/* Actions */}
        {document.status === "ready" && (
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full flex items-center gap-2 justify-center border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              asChild
            >
              <Link
                href={ROUTES.APP.DOCUMENT_AI_CHAT(orgId, trialId, document.id)}
                className="w-full flex items-center justify-center"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-center">Ask AI Assistant</span>
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
              disabled={!fileUrl}
            >
              <a
                href={fileUrl ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                aria-disabled={!fileUrl}
                onClick={(e) => {
                  if (!fileUrl) e.preventDefault();
                }}
              >
                {isLoadingUrl ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                View PDF
              </a>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
              disabled={!fileUrl}
            >
              <a
                href={fileUrl ?? "#"}
                download
                aria-disabled={!fileUrl}
                onClick={(e) => {
                  if (!fileUrl) e.preventDefault();
                }}
              >
                {isLoadingUrl ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
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
