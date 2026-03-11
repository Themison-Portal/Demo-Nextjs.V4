'use client';

import { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { TrialDetails, UpdateTrialInput, AddTrialTeamMemberInput } from '@/services/trials/types';
import { formatDateForApi } from '@/lib/date';

/**
 * Hook for fetching a single trial with full details
 * @param trialId - Trial ID
 */
export function useTrialDetails(trialId: string, orgId: string) {
    const queryClient = useQueryClient();
    const queryKey = ['client', 'trial', trialId];

    // Fetch trial details
    const {
        data: trial,
        isLoading,
        error,
        refetch,
    } = useQuery<TrialDetails>({
        queryKey,
        queryFn: () => apiClient.getTrialById(trialId),
        enabled: !!trialId,
    });

    // Mutation: update trial
    const updateMutation = useMutation({
        mutationFn: (input: UpdateTrialInput) => apiClient.updateTrial(trialId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Mutation: add team member
    const addTeamMemberMutation = useMutation({
        mutationFn: (input: AddTrialTeamMemberInput) =>
            apiClient.addTrialTeamMember(orgId, trialId, input), // <- orgId added
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Derived: team members & PI
    const teamMembers = trial?.team_members || [];
    const principalInvestigator = useMemo(
        () => teamMembers.find((m) => m.trial_role === 'PI'),
        [teamMembers]
    );

    // Helpers
    const updateField = useCallback(
        async (field: string, value: string | null) => {
            await updateMutation.mutateAsync({ [field]: value });
        },
        [updateMutation]
    );

    const updateDate = useCallback(
        async (field: 'start_date' | 'end_date', date: Date | null) => {
            await updateMutation.mutateAsync({
                [field]: date ? formatDateForApi(date) : null,
            });
        },
        [updateMutation]
    );

    const updateSettings = useCallback(
        async (key: string, value: string) => {
            await updateMutation.mutateAsync({ settings: { [key]: value } });
        },
        [updateMutation]
    );

    const assignPI = useCallback(
        async (orgMemberId: string) => {
            await addTeamMemberMutation.mutateAsync({
                org_member_id: orgMemberId,
                trial_role: 'PI', // make sure 'PI' is allowed in your AddTrialTeamMemberInput type
            });
        },
        [addTeamMemberMutation]
    );

    return {
        trial,
        teamMembers,
        principalInvestigator,
        visitSchedules: trial?.visit_schedules || [],

        patientCount: trial?.patient_count || 0,
        activePatientCount: trial?.active_patient_count || 0,
        taskCount: trial?.task_count || 0,
        pendingTaskCount: trial?.pending_task_count || 0,

        isLoading,
        error,
        refetch,

        updateTrial: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error,

        addTeamMember: addTeamMemberMutation.mutateAsync,
        isAddingTeamMember: addTeamMemberMutation.isPending,
        addTeamMemberError: addTeamMemberMutation.error,

        updateField,
        updateDate,
        updateSettings,
        assignPI,
    };
}