/**
 * RAG Service Types
 * Types for document query and AI assistant responses
 */

/**
 * Source citation from RAG backend
 */
export interface RagSource {
  name: string;
  page: number;
  section: string;
  exactText: string;
  bboxes: number[][];
  relevance: "high" | "medium" | "low";
}

/**
 * Request payload for document query
 */
export interface QueryDocumentRequest {
  query: string;
  document_id: string;
  document_name: string;
}

/**
 * Response from RAG backend
 */
export interface QueryDocumentResponse {
  response: string;
  sources: RagSource[];
}
