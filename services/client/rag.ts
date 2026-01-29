/**
 * Client - RAG Service
 * Backend calls for document queries via RAG API
 */

import { isDevelopment } from "@/lib/constants";
import type { QueryDocumentResponse } from "../rag/types";

/**
 * Query a document using RAG backend
 * In development: uses Next.js API proxy at /api/rag/query (to avoid CORS)
 * In production: calls external RAG API directly at url.com/query
 */
export async function queryDocument(
  query: string,
  documentId: string,
  documentName: string
): Promise<QueryDocumentResponse> {
  // In development: use Next.js API route as proxy
  // In production: call external RAG API directly
  const url = isDevelopment ? "/api/rag/query" : `${process.env.NEXT_PUBLIC_RAG_API_URL}/query`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Only add API key in production (server-side proxy handles it in dev)
  if (!isDevelopment && process.env.NEXT_PUBLIC_RAG_API_KEY) {
    headers["X-API-KEY"] = process.env.NEXT_PUBLIC_RAG_API_KEY;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query,
      documentId,
      documentName,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || "Failed to query document");
  }

  return response.json();
}
