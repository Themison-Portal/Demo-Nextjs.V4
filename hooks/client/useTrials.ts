'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/lib/toast';
import type { TrialWithAssignmentsCreate } from '@/services/trials/types';

/**
 * Hook for fetching trials list for an organization
 * @param orgId - Organization ID
 */
export function useTrials(orgId: string) {
    const queryClient = useQueryClient();
    const queryKey = ['client', 'trials', orgId];

    // Fetch trials using apiClient
    const { data, isLoading, error, refetch } = useQuery({
        queryKey,
        queryFn: async () => {
            // apiClient.getTrials returns TrialDetails[]
            const trials = await apiClient.getTrials();
            // wrap in object to match { trials, total } structure
            return { trials, total: trials.length };
        },
        enabled: !!orgId,
    });

    // Mutation: create trial
    const createMutation = useMutation({
        mutationFn: (input: TrialWithAssignmentsCreate) =>
            apiClient.createTrialWithAssignments(orgId, input),
        onSuccess: (newTrial) => {
            queryClient.invalidateQueries({ queryKey });
            toast.success("Trial created", `${newTrial.name} has been created successfully`);
        },
        onError: (err: any) => {
            toast.error("Failed to create trial", err?.message || "Please try again");
        },
    });

    return {
        // Data
        trials: data?.trials || [],
        total: data?.total || 0,

        // Loading & error states
        isLoading,
        error,

        // Actions
        refetch,
        createTrial: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
        createError: createMutation.error,
    };
}