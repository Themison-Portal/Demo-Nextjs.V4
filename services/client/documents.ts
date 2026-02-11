/**
 * Client - Documents Service
 * Backend calls for document operations from Client App
 * Uses /api/client/[orgId]/trials/[trialId]/documents endpoints
 */

import type {
  TrialDocument,
  GetDocumentsResponse,
  UploadDocumentResponse,
  DocumentProcessingStatus,
} from "../documents/types";

/**
 * Get all documents for a trial
 */
export async function getTrialDocuments(
  orgId: string,
  trialId: string
): Promise<GetDocumentsResponse> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/documents`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch documents");
  }

  return response.json();
}

/**
 * Upload a new document to a trial
 */
export async function uploadDocument(
  orgId: string,
  trialId: string,
  file: File,
  category: string
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/documents`,
    {
      method: "POST",
      credentials: "include",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to upload document");
  }

  return response.json();
}

/**
 * Check document processing status (RAG polling)
 */
export async function getDocumentProcessingStatus(
  documentId: string
): Promise<DocumentProcessingStatus> {
  const response = await fetch(`/api/rag/upload/status/${documentId}`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to check processing status");
  }

  return response.json();
}

/**
 * Update document status (after RAG processing completes)
 */
export async function updateDocumentStatus(
  orgId: string,
  trialId: string,
  documentId: string,
  status: string,
  processingError?: string
): Promise<{ document: TrialDocument }> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/documents/${documentId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status,
        processing_error: processingError,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update document status");
  }

  return response.json();
}

/**
 * Update document category
 */
export async function updateDocumentCategory(
  orgId: string,
  trialId: string,
  documentId: string,
  category: string
): Promise<{ document: TrialDocument }> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/documents/${documentId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update document category");
  }

  return response.json();
}
