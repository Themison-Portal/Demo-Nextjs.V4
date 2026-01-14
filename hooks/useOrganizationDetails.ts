/**
 * Organization Details Hook
 * Connects organization details service to React components
 * Uses TanStack Query for caching and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrganizationById,
  updateOrganization,
  inviteMemberToOrganization,
  removeOrganizationMember,
  type OrganizationDetails,
  type UpdateOrganizationInput,
  type AddMemberInput,
} from '@/services/organizations';

const ORGANIZATIONS_QUERY_KEY = ['organizations'];
const organizationDetailsKey = (id: string) => ['organization', id];

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
  });

  // Update organization mutation
  const updateMutation = useMutation({
    mutationFn: (input: UpdateOrganizationInput) => updateOrganization(id, input),
    onSuccess: () => {
      // Invalidate organization details
      queryClient.invalidateQueries({ queryKey: organizationDetailsKey(id) });
      // Invalidate organizations list to update it too
      queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
    },
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: (input: AddMemberInput) => inviteMemberToOrganization(id, input),
    onSuccess: () => {
      // Invalidate organization details to refetch members
      queryClient.invalidateQueries({ queryKey: organizationDetailsKey(id) });
    },
  });

  // Remove member mutation
  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeOrganizationMember(id, userId),
    onSuccess: () => {
      // Invalidate organization details to refetch members
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
