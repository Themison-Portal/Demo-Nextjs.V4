/**
 * Client - useOrganization Hook
 * TanStack Query hook for organization data in Client App
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrganization,
  inviteMember,
  removeMember,
} from '@/services/client/organizations';
import type { AddMemberInput } from '@/services/organizations/types';

/**
 * Hook for organization data and member management in Client App
 * @param orgId - Organization ID
 */
export function useOrganization(orgId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'organization', orgId];

  // Query: get organization with members
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => getOrganization(orgId),
    enabled: !!orgId,
  });

  // Mutation: invite member
  const inviteMutation = useMutation({
    mutationFn: (input: AddMemberInput) => inviteMember(orgId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation: remove member
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(orgId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    // Data
    organization: data,
    members: data?.members || [],
    invitations: data?.invitations || [],

    // Loading states
    isLoading,
    error,

    // Actions
    refetch,
    inviteMember: inviteMutation.mutateAsync,
    isInviting: inviteMutation.isPending,
    inviteError: inviteMutation.error,
    removeMember: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
    removeError: removeMutation.error,
  };
}
