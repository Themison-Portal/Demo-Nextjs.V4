/**
 * Client - useTrials Hook
 * TanStack Query hook for trials list in Client App
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrials, createTrial } from '@/services/client/trials';
import { toast } from '@/lib/toast';
import type { CreateTrialInput } from '@/services/trials/types';

/**
 * Hook for fetching trials list for an organization
 * @param orgId - Organization ID
 */
export function useTrials(orgId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'trials', orgId];

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getTrials(orgId),
    enabled: !!orgId,
  });

  // Mutation: create trial
  const createMutation = useMutation({
    mutationFn: (input: CreateTrialInput) => createTrial(orgId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Trial created", `${data.name} has been created successfully`);
    },
    onError: (error: any) => {
      toast.error("Failed to create trial", error.message || "Please try again");
    },
  });

  return {
    // Data
    trials: data?.trials || [],
    total: data?.total || 0,

    // Loading states
    isLoading,
    error,

    // Actions
    refetch,
    createTrial: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,
  };
}
