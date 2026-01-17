/**
 * Console - Organization Details Hook
 * TanStack Query hook for organization details in Console
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrganizationById,
  updateOrganization,
  inviteMemberToOrganization,
  removeOrganizationMember,
} from '@/services/console/organizations';
import type {
  UpdateOrganizationInput,
  AddMemberInput,
} from '@/services/organizations/types';

const ORGANIZATIONS_QUERY_KEY = ['console', 'organizations'];
const organizationDetailsKey = (id: string) => ['console', 'organization', id];

export function useOrganizationDetails(id: string) {
  const queryClient = useQueryClient();

  // Query organization details with members
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: organizationDetailsKey(id),
    queryFn: () => getOrganizationById(id),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!id,
  });

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationDetailsKey(id) });
      queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
    },
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: (input: AddMemberInput) => inviteMemberToOrganization(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationDetailsKey(id) });
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeOrganizationMember(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationDetailsKey(id) });
    },
  });

  return {
    organization: data || null,
    members: data?.members || [],
    invitations: data?.invitations || [],
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
