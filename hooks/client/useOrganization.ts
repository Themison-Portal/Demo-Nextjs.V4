'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type {
    AddMemberInput,
    UpdateOrganizationInput,
} from '@/services/organizations/types';

export function useOrganization(orgId?: string) {
    const queryClient = useQueryClient();

    const orgQueryKey = ['organization', orgId];
    const membersQueryKey = ['members'];
    const invitationsQueryKey = ['invitations'];

    /**
     * Organization Query
     */
    const {
        data: organization,
        isLoading: isOrgLoading,
        error: orgError,
        refetch: refetchOrganization,
    } = useQuery({
        queryKey: orgQueryKey,
        queryFn: () => apiClient.getOrganization(orgId),
    });

    /**
     * Members Query
     * BE: GET /members
     */
    const {
        data: membersData,
        isLoading: isMembersLoading,
        refetch: refetchMembers,
    } = useQuery({
        queryKey: membersQueryKey,
        queryFn: () => apiClient.getMembers(),
    });

    /**
     * Invitations Query
     * BE: GET /invitations
     */
    const {
        data: invitationsData,
        isLoading: isInvitationsLoading,
        refetch: refetchInvitations,
    } = useQuery({
        queryKey: invitationsQueryKey,
        queryFn: () => apiClient.getInvitations(),
    });

    /**
     * Invite Member Mutation
     */
    const inviteMutation = useMutation({
        mutationFn: (input: AddMemberInput) =>
            apiClient.inviteMemberorg(orgId!, {
                email: input.email,
                org_role: input.org_role,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invitationsQueryKey });
        },
    });

    /**
     * Remove Member Mutation
     */
    const removeMutation = useMutation({
        mutationFn: (memberId: string) => apiClient.removeMember(memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: membersQueryKey });
        },
    });

    /**
     * Update Organization Mutation
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
        members: membersData ?? [],
        invitations: invitationsData ?? [],

        // Loading
        isLoading: isOrgLoading || isMembersLoading || isInvitationsLoading,
        error: orgError,

        // Refetch
        refetch: () => {
            refetchOrganization();
            refetchMembers();
            refetchInvitations();
        },

        // Actions
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