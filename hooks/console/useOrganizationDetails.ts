/**
 * Console - Organization Details Hook
 * TanStack Query hook for organization details in Console
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type {
    UpdateOrganizationInput,
    AddMemberInput,
    OrganizationDetails,
    Member,
    Invitation,
} from '@/services/organizations/types';

const ORGANIZATIONS_QUERY_KEY = ['console', 'organizations'];
const organizationDetailsKey = (id: string) => ['console', 'organization', id];

export function useOrganizationDetails(id: string) {
    const queryClient = useQueryClient();

    // Query organization details with members and invitations
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: organizationDetailsKey(id),
        queryFn: async (): Promise<OrganizationDetails> => {
            const response = await apiClient.getOrganization(id) as OrganizationDetails;
            return response;
        },
        staleTime: 1000 * 60 * 2, // 2 minutes
        enabled: !!id,
    });

    // Update organization mutation
    const updateMutation = useMutation({
        mutationFn: (input: UpdateOrganizationInput) =>
            apiClient.patchOrganization(id, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizationDetailsKey(id) });
            queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
        },
    });

    // Invite member mutation
    const inviteMutation = useMutation({
        mutationFn: (input: AddMemberInput) =>
            apiClient.inviteMemberToOrganization({ email: input.email, org_role: input.org_role, name: input.name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizationDetailsKey(id) });
        },
    });

    // Remove member mutation
    const removeMutation = useMutation({
        mutationFn: (memberId: string) =>
            apiClient.removeMember(id, memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: organizationDetailsKey(id) });
        },
    });

    return {
        organization: data || null,
        members: data?.members?.map((m) => ({
            id: m.id,
            email: m.user.email,
            first_name: m.user.first_name,
            last_name: m.user.last_name,
            org_role: m.org_role,
            deleted_at: m.deleted_at,
        })) || [],
        invitations: data?.invitations?.map((i) => ({
            id: i.id,
            email: i.email,
            initial_role: i.initial_role,
            status: i.status,
            expires_at: i.expires_at,
            name: i.name,
        })) || [],
        isLoading,
        error: error as Error | null,
        refetch,
        updateOrganization: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        inviteMember: inviteMutation.mutateAsync,
        isInviting: inviteMutation.isPending,
        removeMember: removeMutation.mutateAsync,
        isRemoving: removeMutation.isPending,
    };
}