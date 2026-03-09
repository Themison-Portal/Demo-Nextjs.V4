/**
 * Client - RAG Service
 * Backend calls for document queries via RAG API
 */

import type { QueryDocumentResponse } from "../rag/types";

/**
 * Query a document using RAG backend
 * Always uses Next.js API proxy at /api/rag/query for security and CORS handling
 */
export async function queryDocument(
    query: string,
    documentId: string,
    documentName: string
): Promise<QueryDocumentResponse> {
    // Always use Next.js API route as proxy (both dev and prod)
    // This keeps API keys server-side and avoids CORS issues
    const response = await fetch("/api/rag/query", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            query,
            document_id: documentId,
            document_name: documentName,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error.error || "Failed to query document");
    }

    return response.json();
}
