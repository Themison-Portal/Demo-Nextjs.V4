/**
 * Client - useTrialDocuments Hook
 * TanStack Query hook for trial documents with RAG processing polling
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTrialDocuments,
  uploadDocument,
  updateDocumentCategory,
  getDocumentProcessingStatus,
  updateDocumentStatus,
} from "@/services/client/documents";
import type { DocumentProcessingStatus } from "@/services/documents";

const POLLING_INTERVAL = 5000;

/**
 * Hook for fetching documents for a trial
 * Automatically polls RAG processing status for documents in "processing" state
 */
export function useTrialDocuments(orgId: string, trialId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["client", "trial-documents", trialId];
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  // Reactive state for processing statuses (triggers re-renders)
  const [processingStatuses, setProcessingStatuses] = useState<
    Map<string, DocumentProcessingStatus>
  >(new Map());

  // Callback to notify consumers about status changes
  const statusChangeCallbackRef = useRef<
    ((docId: string, status: DocumentProcessingStatus) => void) | null
  >(null);

  const onProcessingStatusChange = useCallback(
    (callback: (docId: string, status: DocumentProcessingStatus) => void) => {
      statusChangeCallbackRef.current = callback;
    },
    [],
  );

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getTrialDocuments(orgId, trialId),
    enabled: !!orgId && !!trialId,
  });

  const documents = data?.documents || [];

  // Poll processing status using recursive setTimeout (no concurrency)
  useEffect(() => {
    const processingDocs = documents.filter((d) => d.status === "processing");

    if (processingDocs.length === 0) {
      setProcessingStatuses((prev) => {
        if (prev.size === 0) return prev;
        return new Map();
      });
      return;
    }

    cancelledRef.current = false;

    const poll = async () => {
      if (cancelledRef.current) return;

      const results = await Promise.allSettled(
        processingDocs.map((doc) => getDocumentProcessingStatus(doc.id)),
      );

      if (cancelledRef.current) return;

      // Check each result for terminal status
      let hasTerminal = false;

      const statusMap = new Map<string, DocumentProcessingStatus>();
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const docId = processingDocs[index].id;
          statusMap.set(docId, result.value);
          if (
            result.value.status === "completed" ||
            result.value.status === "failed"
          ) {
            hasTerminal = true;
          }
        }
      });

      // Update UI with latest statuses
      setProcessingStatuses(statusMap);

      if (hasTerminal) {
        // Terminal detected — PATCH each terminal doc, then refetch
        const patchPromises = Array.from(statusMap.entries())
          .filter(
            ([, s]) => s.status === "completed" || s.status === "failed",
          )
          .map(async ([docId, status]) => {
            const dbStatus =
              status.status === "completed" ? "ready" : "error";
            try {
              await updateDocumentStatus(
                orgId,
                trialId,
                docId,
                dbStatus,
                status.error,
              );
            } catch (err) {
              console.error("[Hook] Failed to update document status:", err);
            }
            statusChangeCallbackRef.current?.(docId, status);
          });

        await Promise.all(patchPromises);

        if (!cancelledRef.current) {
          await queryClient.invalidateQueries({ queryKey });
        }
        // Don't schedule next poll — useEffect will re-run if needed
        return;
      }

      // Not terminal — schedule next poll
      if (!cancelledRef.current) {
        timeoutRef.current = setTimeout(poll, POLLING_INTERVAL);
      }
    };

    // Start first poll
    poll();

    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    documents
      .filter((d) => d.status === "processing")
      .map((d) => d.id)
      .sort()
      .join(","),
  ]);

  // Mutation: upload document
  const uploadMutation = useMutation({
    mutationFn: ({ file, category }: { file: File; category: string }) =>
      uploadDocument(orgId, trialId, file, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation: update document category
  const updateCategoryMutation = useMutation({
    mutationFn: ({
      documentId,
      category,
    }: {
      documentId: string;
      category: string;
    }) => updateDocumentCategory(orgId, trialId, documentId, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    documents,
    total: data?.total || 0,
    isLoading,
    error,
    refetch,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    updateCategory: updateCategoryMutation.mutateAsync,
    isUpdatingCategory: updateCategoryMutation.isPending,
    processingStatuses,
    onProcessingStatusChange,
  };
}
