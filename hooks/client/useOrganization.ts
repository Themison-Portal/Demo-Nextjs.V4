/**
 * Client - useOrganization Hook
 * TanStack Query hook for organization data in Client App
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

import type {
    AddMemberInput,
    UpdateOrganizationInput,
} from '@/services/organizations/types';

/**
 * Hook for organization data and member management
 */
export function useOrganization(orgId: string) {
    const queryClient = useQueryClient();

    const orgQueryKey = ['organization', orgId];
    const membersQueryKey = ['organization-members', orgId];

    /**
     * Query: organization details
     */
    const {
        data: organization,
        isLoading: isOrgLoading,
        error: orgError,
        refetch,
    } = useQuery({
        queryKey: orgQueryKey,
        queryFn: () => apiClient.getOrganization(orgId),
        enabled: !!orgId,
    });

    /**
     * Query: team members
     */
    const {
        data: membersData,
        isLoading: isMembersLoading,
    } = useQuery({
        queryKey: membersQueryKey,
        queryFn: () => apiClient.getTeamMembers(),
        enabled: !!orgId,
    });

    /**
     * Mutation: invite member
     */
    const inviteMutation = useMutation({
        mutationFn: (input: AddMemberInput) =>
            apiClient.inviteMemberorg(orgId, {
                email: input.email,
                org_role: input.org_role,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: membersQueryKey });
        },
    });

    /**
     * Mutation: remove member
     */
    const removeMutation = useMutation({
        mutationFn: (memberId: string) => apiClient.removeMember(memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: membersQueryKey });
        },
    });

    /**
     * Mutation: update organization
     */
    const updateMutation = useMutation({
        mutationFn: (input: UpdateOrganizationInput) =>
            apiClient.updateOrganization(
                {
                    name: input.name,
                    settings: input.settings,
                },
                orgId
            ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orgQueryKey });
        },
    });

    return {
        // Data
        organization,
        members: membersData?.members ?? [],
        invitations: membersData?.invitations ?? [],

        // Loading
        isLoading: isOrgLoading || isMembersLoading,
        error: orgError,

        // Actions
        refetch,

        inviteMember: inviteMutation.mutateAsync,
        isInviting: inviteMutation.isPending,
        inviteError: inviteMutation.error,

        removeMember: removeMutation.mutateAsync,
        isRemoving: removeMutation.isPending,
        removeError: removeMutation.error,

        updateOrganization: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error,
    };
}