/**
 * Document Types
 * Based on trial_documents table schema
 */

// ============================================================================
// DOCUMENT CATEGORY
// ============================================================================

export type DocumentCategory =
  | "protocol"
  | "amendments"
  | "regulatory"
  | "consent"
  | "ops"
  | "safety"
  | "admin"
  | "other";

// ============================================================================
// DOCUMENT STATUS
// ============================================================================

export type DocumentStatus = "uploading" | "processing" | "ready" | "error";

// ============================================================================
// TRIAL DOCUMENT
// ============================================================================

export interface TrialDocument {
  id: string;
  trial_id: string;
  file_name: string;
  file_size: number;
  file_type: string;
  storage_path: string;
  storage_url: string;
  status: DocumentStatus;
  category?: DocumentCategory | null;
  uploaded_by?: string | null;
  processing_error?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// ============================================================================
// RAG BACKEND TYPES
// ============================================================================

export interface RAGIndexRequest {
  doc_id: string;
  url: string;
  api_key: string;
}

export interface RAGIndexResponse {
  status: "succeeded" | "failed";
  doc_id: string;
  error?: string;
}

export interface RAGQueryRequest {
  doc_id: string;
  query: string;
  api_key: string;
}

export interface RAGQueryResponse {
  doc_id: string;
  query: string;
  answer: string;
  chunks?: Array<{
    content: string;
    score: number;
  }>;
}

// ============================================================================
// DOCUMENT PROCESSING STATUS (RAG Polling)
// ============================================================================

export interface DocumentProcessingStatus {
  document_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  stage?: string;
  progress?: number;
  chunks_count?: number;
  error?: string;
  started_at?: string;
  updated_at?: string;
  completed_at?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface UploadDocumentResponse {
  document: TrialDocument;
  message: string;
}

export interface GetDocumentsResponse {
  documents: TrialDocument[];
  total: number;
}
