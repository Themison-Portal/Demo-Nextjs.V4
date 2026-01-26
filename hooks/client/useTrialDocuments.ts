/**
 * Client - useTrialDocuments Hook
 * TanStack Query hook for trial documents
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrialDocuments, uploadDocument, updateDocumentCategory } from '@/services/client/documents';

/**
 * Hook for fetching documents for a trial
 * @param orgId - Organization ID
 * @param trialId - Trial ID
 */
export function useTrialDocuments(orgId: string, trialId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'trial-documents', trialId];

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
    documents: data?.documents || [],
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
  };
}
