/**
 * Document Constants
 * Centralized definitions for document-related enums and options
 */

import type {
  DocumentCategory,
  DocumentStatus,
} from "@/services/documents/types";

// ============================================================================
// CATEGORY
// ============================================================================

export const DOCUMENT_CATEGORY = {
  PROTOCOL: "protocol",
  AMENDMENTS: "amendments",
  REGULATORY: "regulatory",
  CONSENT: "consent",
  OPS: "ops",
  SAFETY: "safety",
  ADMIN: "admin",
  OTHER: "other",
} as const;

export const DOCUMENT_CATEGORY_OPTIONS: {
  value: DocumentCategory;
  label: string;
}[] = [
  { value: "protocol", label: "Protocols" },
  { value: "amendments", label: "Amendments" },
  { value: "regulatory", label: "Regulatory & Legal" },
  { value: "consent", label: "Patient Consent (ICF)" },
  { value: "ops", label: "Operations & Lab" },
  { value: "safety", label: "Safety & SAEs" },
  { value: "admin", label: "Administrative" },
  { value: "other", label: "Other" },
];

export const DOCUMENT_CATEGORY_STYLES: Record<DocumentCategory, string> = {
  protocol: "bg-blue-100 text-blue-700",
  amendments: "bg-indigo-100 text-indigo-700",
  regulatory: "bg-purple-100 text-purple-700",
  consent: "bg-green-100 text-green-700",
  ops: "bg-yellow-100 text-yellow-700",
  safety: "bg-red-100 text-red-700",
  admin: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-600",
};

// ============================================================================
// STATUS
// ============================================================================

export const DOCUMENT_STATUS = {
  UPLOADING: "uploading",
  PROCESSING: "processing",
  READY: "ready",
  ERROR: "error",
} as const;

export const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  uploading: "bg-gray-100 text-gray-700",
  processing: "bg-yellow-100 text-yellow-700",
  ready: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};
