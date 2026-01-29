"use client";

import { useMutation } from "@tanstack/react-query";
import { queryDocument } from "@/services/client/rag";
import type { QueryDocumentResponse } from "@/services/rag/types";

interface QueryDocumentParams {
  query: string;
  documentId: string;
  documentName: string;
}

/**
 * Hook for querying documents via RAG backend
 * Returns a mutation that can be called with a query string
 */
export function useDocumentQuery() {
  const mutation = useMutation<QueryDocumentResponse, Error, QueryDocumentParams>({
    mutationFn: ({ query, documentId, documentName }) =>
      queryDocument(query, documentId, documentName),
  });

  return {
    queryDocument: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
  };
}
