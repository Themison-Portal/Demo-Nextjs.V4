/**
 * Client - Documents Service
 * Backend calls for document operations from Client App
 * Uses /api/client/[orgId]/trials/[trialId]/documents endpoints
 */

import type {
  TrialDocument,
  GetDocumentsResponse,
  UploadDocumentResponse,
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
  file: File
): Promise<UploadDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

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
