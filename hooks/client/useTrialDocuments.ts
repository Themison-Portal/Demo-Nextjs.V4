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
const SMOOTH_TICK_MS = 3000;
const SMOOTH_INCREMENT = 0.8;

export interface SmoothedProcessingStatus extends DocumentProcessingStatus {
  displayProgress: number;
}

/**
 * Hook for fetching documents for a trial
 * Automatically polls RAG processing status for documents in "processing" state
 */
export function useTrialDocuments(orgId: string, trialId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["client", "trial-documents", trialId];
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reactive state for processing statuses (triggers re-renders)
  const [processingStatuses, setProcessingStatuses] = useState<
    Map<string, SmoothedProcessingStatus>
  >(new Map());

  // Track documents that already fired terminal callback (prevent duplicate toasts)
  const notifiedTerminalRef = useRef<Set<string>>(new Set());

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

  // Poll processing status for documents in "processing" state
  useEffect(() => {
    const processingDocs = documents.filter((d) => d.status === "processing");

    if (processingDocs.length === 0) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      setProcessingStatuses((prev) => {
        if (prev.size === 0) return prev;
        return new Map();
      });
      return;
    }

    const pollStatuses = async () => {
      const results = await Promise.allSettled(
        processingDocs.map((doc) => getDocumentProcessingStatus(doc.id)),
      );

      // Collect terminal statuses BEFORE state update
      const terminalDocs: {
        docId: string;
        status: DocumentProcessingStatus;
      }[] = [];

      setProcessingStatuses((prev) => {
        const next = new Map(prev);

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            const status = result.value;
            const docId = processingDocs[index].id;
            const realProgress = status.progress || 0;
            const currentDisplay = prev.get(docId)?.displayProgress || 0;

            next.set(docId, {
              ...status,
              displayProgress: currentDisplay,
            });

            if (status.status === "completed" || status.status === "failed") {
              if (!notifiedTerminalRef.current.has(docId)) {
                notifiedTerminalRef.current.add(docId);
                terminalDocs.push({ docId, status });
              }
            }
          }
        });

        return next;
      });

      // Handle terminal docs: stop polling immediately, then await PATCH
      if (terminalDocs.length > 0) {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }

        await Promise.all(
          terminalDocs.map(async ({ docId, status }) => {
            const dbStatus = status.status === "completed" ? "ready" : "error";
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
              // Allow retry on next poll cycle
              notifiedTerminalRef.current.delete(docId);
            }
            statusChangeCallbackRef.current?.(docId, status);
          }),
        );

        // Now the DB is updated — safe to refetch
        await queryClient.invalidateQueries({ queryKey });

        // Clean up processing statuses after refetch
        setProcessingStatuses((p) => {
          const cleaned = new Map(p);
          terminalDocs.forEach(({ docId }) => cleaned.delete(docId));
          return cleaned;
        });
      }
    };

    pollStatuses();
    pollingRef.current = setInterval(pollStatuses, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
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

  // Smooth progress: slowly increment displayProgress between polls
  useEffect(() => {
    if (processingStatuses.size === 0) return;

    const tick = setInterval(() => {
      setProcessingStatuses((prev) => {
        let changed = false;
        const next = new Map(prev);

        next.forEach((status, docId) => {
          const realProgress = status.progress || 0;
          const ceiling = Math.min(realProgress + 15, 95);

          if (status.displayProgress < ceiling) {
            changed = true;
            next.set(docId, {
              ...status,
              displayProgress: Math.min(
                status.displayProgress + SMOOTH_INCREMENT,
                ceiling,
              ),
            });
          }
        });

        return changed ? next : prev;
      });
    }, SMOOTH_TICK_MS);

    return () => clearInterval(tick);
  }, [processingStatuses.size]);

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
