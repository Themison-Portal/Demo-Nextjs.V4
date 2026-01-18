/**
 * Client - useTrialDetails Hook
 * TanStack Query hook for single trial details in Client App
 */

'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTrialById, updateTrial, addTrialTeamMember } from '@/services/client/trials';
import type { UpdateTrialInput, AddTrialTeamMemberInput } from '@/services/trials/types';
import { formatDateForApi } from '@/lib/date';

/**
 * Hook for fetching a single trial with full details
 * @param orgId - Organization ID
 * @param trialId - Trial ID
 */
export function useTrialDetails(orgId: string, trialId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'trial', orgId, trialId];

  const {
    data: trial,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getTrialById(orgId, trialId),
    enabled: !!orgId && !!trialId,
  });

  // Mutation: update trial
  const updateMutation = useMutation({
    mutationFn: (input: UpdateTrialInput) => updateTrial(orgId, trialId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Also invalidate trials list
      queryClient.invalidateQueries({ queryKey: ['client', 'trials', orgId] });
    },
  });

  // Mutation: add/update team member (used for assigning PI)
  const addTeamMemberMutation = useMutation({
    mutationFn: (input: AddTrialTeamMemberInput) => addTrialTeamMember(orgId, trialId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['client', 'trials', orgId] });
    },
  });

  // Derived: Principal Investigator
  const teamMembers = trial?.team_members || [];
  const principalInvestigator = useMemo(
    () => teamMembers.find((m) => m.trial_role === 'PI'),
    [teamMembers]
  );

  // Helper: Update a single field
  const updateField = useCallback(
    async (field: string, value: string | null) => {
      await updateMutation.mutateAsync({ [field]: value });
    },
    [updateMutation]
  );

  // Helper: Update date field (handles Date -> API format)
  const updateDate = useCallback(
    async (field: 'start_date' | 'end_date', date: Date | null) => {
      await updateMutation.mutateAsync({
        [field]: date ? formatDateForApi(date) : null,
      });
    },
    [updateMutation]
  );

  // Helper: Update settings (sponsor, location, etc.)
  const updateSettings = useCallback(
    async (key: string, value: string) => {
      await updateMutation.mutateAsync({ settings: { [key]: value } });
    },
    [updateMutation]
  );

  // Helper: Assign PI
  const assignPI = useCallback(
    async (orgMemberId: string) => {
      await addTeamMemberMutation.mutateAsync({
        org_member_id: orgMemberId,
        trial_role: 'PI',
      });
    },
    [addTeamMemberMutation]
  );

  return {
    // Data
    trial,
    teamMembers,
    visitSchedules: trial?.visit_schedules || [],
    principalInvestigator,

    // Stats
    patientCount: trial?.patient_count || 0,
    activePatientCount: trial?.active_patient_count || 0,
    taskCount: trial?.task_count || 0,
    pendingTaskCount: trial?.pending_task_count || 0,

    // Loading states
    isLoading,
    error,

    // Actions
    refetch,
    updateTrial: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    addTeamMember: addTeamMemberMutation.mutateAsync,
    isAddingTeamMember: addTeamMemberMutation.isPending,

    // Helpers (for components - no logic needed there)
    updateField,
    updateDate,
    updateSettings,
    assignPI,
  };
}
