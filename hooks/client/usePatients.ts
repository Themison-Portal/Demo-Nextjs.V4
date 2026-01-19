'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPatients,
  createPatient,
  updatePatient,
  deletePatient,
} from '@/services/client/patients';
import type { CreatePatientInput, UpdatePatientInput } from '@/services/patients/types';

export function usePatients(orgId: string, trialId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'patients', orgId, trialId];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getPatients(orgId, trialId),
    enabled: !!orgId && !!trialId,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreatePatientInput) =>
      createPatient(orgId, trialId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ patientId, input }: { patientId: string; input: UpdatePatientInput }) =>
      updatePatient(orgId, trialId, patientId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (patientId: string) =>
      deletePatient(orgId, trialId, patientId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
    },
  });

  return {
    patients: data?.patients || [],
    total: data?.total || 0,
    isLoading,
    error,
    createPatient: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updatePatient: (patientId: string, input: UpdatePatientInput) =>
      updateMutation.mutateAsync({ patientId, input }),
    isUpdating: updateMutation.isPending,
    deletePatient: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
