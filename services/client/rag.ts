/**
 * Client - RAG Service
 * Backend calls for document queries via RAG API
 */

import { apiClient } from "@/lib/apiClient";
import type { QueryDocumentResponse } from "../rag/types";

export const queryDocument = (
    query: string,
    documentId: string,
    documentName: string
): Promise<QueryDocumentResponse> =>
    apiClient.ragQuery({
        query,
        document_id: documentId,
        document_name: documentName,
    });