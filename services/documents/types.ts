/**
 * Document Types
 * Based on trial_documents table schema
 */

// ============================================================================
// DOCUMENT STATUS
// ============================================================================

export type DocumentStatus = 'uploading' | 'processing' | 'ready' | 'error';

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
  status: 'succeeded' | 'failed';
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
