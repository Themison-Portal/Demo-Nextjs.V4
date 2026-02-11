/**
 * Client - useTrialDocuments Hook
 * TanStack Query hook for trial documents with RAG processing polling
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTrialDocuments,
  uploadDocument,
  updateDocumentCategory,
  getDocumentProcessingStatus,
} from '@/services/client/documents';
import type { DocumentProcessingStatus } from '@/services/documents';

const POLLING_INTERVAL = 5000;

/**
 * Hook for fetching documents for a trial
 * Automatically polls RAG processing status for documents in "processing" state
 */
export function useTrialDocuments(orgId: string, trialId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'trial-documents', trialId];
  const processingStatusesRef = useRef<Map<string, DocumentProcessingStatus>>(new Map());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getTrialDocuments(orgId, trialId),
    enabled: !!orgId && !!trialId,
  });

  const documents = data?.documents || [];

  // Callback to notify consumers about status changes
  const statusChangeCallbackRef = useRef<
    ((docId: string, status: DocumentProcessingStatus) => void) | null
  >(null);

  const onProcessingStatusChange = useCallback(
    (callback: (docId: string, status: DocumentProcessingStatus) => void) => {
      statusChangeCallbackRef.current = callback;
    },
    []
  );

  // Poll processing status for documents in "processing" state
  useEffect(() => {
    const processingDocs = documents.filter((d) => d.status === 'processing');

    if (processingDocs.length === 0) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    const pollStatuses = async () => {
      const results = await Promise.allSettled(
        processingDocs.map((doc) => getDocumentProcessingStatus(doc.id))
      );

      let shouldRefetch = false;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const status = result.value;
          const docId = processingDocs[index].id;

          processingStatusesRef.current.set(docId, status);

          if (status.status === 'completed' || status.status === 'failed') {
            shouldRefetch = true;
            statusChangeCallbackRef.current?.(docId, status);
            // Clean up completed/failed entries after refetch
            setTimeout(() => processingStatusesRef.current.delete(docId), 1000);
          }
        }
      });

      if (shouldRefetch) {
        queryClient.invalidateQueries({ queryKey });
      }
    };

    // Poll immediately, then every interval
    pollStatuses();
    pollingRef.current = setInterval(pollStatuses, POLLING_INTERVAL);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // Re-create interval when the set of processing doc IDs changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    documents
      .filter((d) => d.status === 'processing')
      .map((d) => d.id)
      .sort()
      .join(','),
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
    mutationFn: ({ documentId, category }: { documentId: string; category: string }) =>
      updateDocumentCategory(orgId, trialId, documentId, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    // Data
    documents,
    total: data?.total || 0,

    // Loading states
    isLoading,
    error,

    // Actions
    refetch,
    uploadDocument: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    uploadError: uploadMutation.error,
    updateCategory: updateCategoryMutation.mutateAsync,
    isUpdatingCategory: updateCategoryMutation.isPending,

    // Processing polling
    processingStatuses: processingStatusesRef.current,
    onProcessingStatusChange,
  };
}
