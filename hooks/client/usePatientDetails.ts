/**
 * Client - usePatientDetails Hook
 * TanStack Query hook for single patient details in Client App
 */

'use client';

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatientById, updatePatient } from '@/services/client/patients';
import type { UpdatePatientInput } from '@/services/patients/types';
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

  const {
    data: patient,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getPatientById(orgId, trialId, patientId),
    enabled: !!orgId && !!trialId && !!patientId,
  });

  // Mutation: update patient
  const updateMutation = useMutation({
    mutationFn: (input: UpdatePatientInput) => updatePatient(orgId, trialId, patientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate patients list
      queryClient.invalidateQueries({ queryKey: ['client', 'patients', orgId, trialId] });
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
    async (field: 'date_of_birth' | 'enrollment_date' | 'visit_start_date', date: Date | null) => {
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

    // Helpers (for components - no logic needed there)
    updateField,
    updateDate,
  };
}
