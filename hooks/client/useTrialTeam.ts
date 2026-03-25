'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/lib/toast';
import type {
    AddTrialTeamMemberInput,
    TrialTeamMember,
    TrialRole,
} from '@/services/trials/types';

export function useTrialTeam(orgId: string, trialId: string) {
    const queryClient = useQueryClient();
    const queryKey = ['client', 'trial-team', orgId, trialId];

    // -----------------------
    // Query: Get team members
    // -----------------------
    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: () => apiClient.getTrialTeamMembers(trialId),
        enabled: !!orgId && !!trialId,
    });



    // -----------------------
    // Mutation: Add team member
    // -----------------------
    const addMutation = useMutation({
        mutationFn: (input: AddTrialTeamMemberInput) =>
            apiClient.addTrialTeamMember(orgId, trialId, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.refetchQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
            toast.success('Team member added', 'The member has been added to the trial team');
        },
        onError: (err: any) => {
            toast.error('Failed to add team member', err?.message || 'Please try again');
        },
    });

    // -----------------------
    // Mutation: Update role
    // -----------------------
    const updateRoleMutation = useMutation({
        mutationFn: ({ orgMemberId, role }: { orgMemberId: string; role: TrialRole }) =>
            apiClient.updateTrialTeamMember(orgId, trialId, orgMemberId, role),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
        },
    });

    // -----------------------
    // Mutation: Update settings
    // -----------------------
    const updateSettingsMutation = useMutation({
        mutationFn: ({
            orgMemberId,
            settings,
        }: {
            orgMemberId: string;
            settings?: { notes?: string; contact_info?: string;[key: string]: unknown };
        }) => apiClient.updateTrialTeamMemberSettings(orgId, trialId, orgMemberId, settings || {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // -----------------------
    // Mutation: Update status
    // -----------------------
    const updateStatusMutation = useMutation({
        mutationFn: ({
            orgMemberId,
            status,
        }: {
            orgMemberId: string;
            status: 'active' | 'inactive';
        }) => apiClient.updateTrialTeamMemberStatus(orgId, trialId, orgMemberId, status),
        onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    });

    // -----------------------
    // Mutation: Remove member
    // -----------------------
    const removeMutation = useMutation({
        mutationFn: (orgMemberId: string) =>
            apiClient.removeTrialTeamMember(orgId, trialId, orgMemberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
        },
    });
    const teamMembers = (data || []).map((m: any) => ({
        ...m,
        trial_role: m.role_name,
        assigned_at: m.created_at,
        org_member_id: m.member_id,
        status: m.is_active ? 'active' : 'inactive',
        user: {
            full_name: m.member_name,
            email: m.member_email,
            first_name: m.first_name,
            last_name: m.last_name,
        }
    }));

    return {
        // Data
        teamMembers,
        isLoading,
        error,

        // Mutations
        addTeamMember: addMutation.mutateAsync,
        isAdding: addMutation.isPending,

        updateRole: (orgMemberId: string, role: TrialRole) =>
            updateRoleMutation.mutateAsync({ orgMemberId, role }),
        isUpdatingRole: updateRoleMutation.isPending,

        updateSettings: (
            orgMemberId: string,
            settings: Partial<TrialTeamMember['settings']>
        ) => updateSettingsMutation.mutateAsync({ orgMemberId, settings }),
        isUpdatingSettings: updateSettingsMutation.isPending,

        updateStatus: (orgMemberId: string, status: 'active' | 'inactive') =>
            updateStatusMutation.mutateAsync({ orgMemberId, status }),
        isUpdatingStatus: updateStatusMutation.isPending,

        removeMember: removeMutation.mutateAsync,
        isRemoving: removeMutation.isPending,
    };
}