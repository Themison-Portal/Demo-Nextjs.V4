'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type {
    AddMemberInput,
    UpdateOrganizationInput,
} from '@/services/organizations/types'
import type { OrganizationUser } from '@/components/app/organization/OrganizationMembers'

interface Invitation {
    email: string
    org_role: string
    expires_at: string
}

interface UseOrganizationReturn {
    organization: any // type properly if you have Organization type
    members: OrganizationUser[]
    invitations: Invitation[]
    isLoading: boolean
    error: Error | null
    refetch: () => void

    inviteMember: (invite: AddMemberInput) => Promise<void>
    isInviting: boolean
    inviteError: Error | null

    removeMember: (memberId: string) => Promise<void>
    isRemoving: boolean
    removeError: Error | null

    updateOrganization: (input: UpdateOrganizationInput) => Promise<void>
    isUpdating: boolean
    updateError: Error | null
}

export function useOrganization(orgId?: string): UseOrganizationReturn {
    const queryClient = useQueryClient()

    const orgQueryKey = ['organization', orgId]
    const membersQueryKey = ['organization', orgId, 'members']
    const invitationsQueryKey = ['organization', orgId, 'invitations']

    // -------------------------------
    // Organization Query
    // -------------------------------
    const {
        data: organization,
        isLoading: isOrgLoading,
        error: orgError,
        refetch: refetchOrganization,
    } = useQuery<any>({
        queryKey: orgQueryKey,
        queryFn: () => apiClient.getOrganization(orgId!),
        enabled: !!orgId,
    })

    // -------------------------------
    // Members Query
    // -------------------------------
    const {
        data: membersData,
        isLoading: isMembersLoading,
        refetch: refetchMembers,
    } = useQuery<OrganizationUser[]>({
        queryKey: membersQueryKey,
        queryFn: () => apiClient.getMembers() as Promise<OrganizationUser[]>, // <-- call without args if BE auto filters by org
        enabled: !!orgId,
    })

    // -------------------------------
    // Invitations Query
    // -------------------------------
    const {
        data: invitationsData,
        isLoading: isInvitationsLoading,
        refetch: refetchInvitations,
    } = useQuery<Invitation[]>({
        queryKey: invitationsQueryKey,
        queryFn: () => apiClient.getInvitations() as Promise<Invitation[]>,
        enabled: !!orgId,
    })

    // -------------------------------
    // Invite Member Mutation
    // -------------------------------
    const inviteMutation = useMutation<void, Error, AddMemberInput>({
        mutationFn: (input) => apiClient.inviteMemberorg(orgId!, input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invitationsQueryKey })
        },
    })

    // -------------------------------
    // Remove Member Mutation
    // -------------------------------
    const removeMutation = useMutation<void, Error, string>({
        mutationFn: (memberId) => apiClient.removeMember(memberId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: membersQueryKey })
        },
    })

    // -------------------------------
    // Update Organization Mutation
    // -------------------------------
    const updateMutation = useMutation<void, Error, UpdateOrganizationInput>({
        mutationFn: (input) => apiClient.updateOrganization(input, orgId!),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: orgQueryKey })
        },
    })

    return {
        // Data
        organization,
        members: (membersData ?? []).map((m: any) => ({
            ...m,
            user_id: m.id,
            user: {
                full_name: m.name,
                email: m.email,
                first_name: m.first_name,
                last_name: m.last_name,
            }
        })),
        invitations: invitationsData ?? [],

        // Loading & Error
        isLoading: isOrgLoading || isMembersLoading || isInvitationsLoading,
        error: orgError ?? null,

        // Refetch
        refetch: () => {
            refetchOrganization()
            refetchMembers()
            refetchInvitations()
        },

        // Actions
        inviteMember: inviteMutation.mutateAsync,
        isInviting: inviteMutation.isPending,
        inviteError: inviteMutation.error ?? null,

        removeMember: removeMutation.mutateAsync,
        isRemoving: removeMutation.isPending,
        removeError: removeMutation.error ?? null,

        updateOrganization: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error ?? null,
    }
}