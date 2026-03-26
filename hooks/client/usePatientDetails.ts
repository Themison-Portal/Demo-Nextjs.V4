/**
 * Client - usePatientDetails Hook
 * TanStack Query hook for single patient details in Client App
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { Patient, UpdatePatientInput } from '@/services/patients/types';
import { formatDateForApi } from '@/lib/date';

/**
 * Hook for fetching a single patient with full details
 * @param orgId - Organization ID
 * @param trialId - Trial ID
 * @param patientId - Patient ID
 */
export function usePatientDetails(orgId: string, trialId: string, patientId: string) {
    const queryClient = useQueryClient();
    const queryKey = ['client', 'patient', orgId, trialId, patientId];

    // Fetch patient details
    const {
        data: patient,
        isLoading,
        error,
        refetch,
    } = useQuery<Patient>({
        queryKey,
        queryFn: async () =>
            await apiClient.getPatientById(patientId), // ✅ uses apiClient
        enabled: !!orgId && !!trialId && !!patientId,
    });

    // Mutation: update patient
    const updateMutation = useMutation({
        mutationFn: async (input: UpdatePatientInput) =>
            await apiClient.updatePatient(patientId, input), // uses apiClient
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['client', 'patients', orgId, trialId] });
        },
    });

    // Mutation: delete patient (soft delete)
    const deleteMutation = useMutation({
        mutationFn: async () => await apiClient.deletePatient(patientId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['client', 'patients', orgId, trialId] });
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Helper: Update a single field
    const updateField = useCallback(
        async (field: string, value: string | null) => {
            await updateMutation.mutateAsync({ [field]: value });
        },
        [updateMutation]
    );

    // Helper: Update date field (handles Date -> API format)
    const updateDate = useCallback(
        async (
            field: 'date_of_birth' | 'enrollment_date' | 'visit_start_date',
            date: Date | null
        ) => {
            await updateMutation.mutateAsync({
                [field]: date ? formatDateForApi(date) : null,
            });
        },
        [updateMutation]
    );

    return {
        // Data
        patient,

        // Loading states
        isLoading,
        error,

        // Actions
        refetch,
        updatePatient: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error,
        deletePatient: deleteMutation.mutateAsync,
        isDeleting: deleteMutation.isPending,
        deleteError: deleteMutation.error,

        // Helpers
        updateField,
        updateDate,
    };
}