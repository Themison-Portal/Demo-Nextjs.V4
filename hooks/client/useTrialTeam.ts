/**
 * Hook: useTrialTeam
 * Manages trial team members with TanStack Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTrialTeam,
  addTrialTeamMember,
  updateTrialTeamMember,
  updateTrialTeamMemberSettings,
  updateTrialTeamMemberStatus,
  removeTrialTeamMember,
} from '@/services/client/trials';
import type { AddTrialTeamMemberInput, TrialRole } from '@/services/trials/types';

export function useTrialTeam(orgId: string, trialId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'trial-team', orgId, trialId];

  // Query: get team members
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getTrialTeam(orgId, trialId),
    enabled: !!orgId && !!trialId,
  });

  // Mutation: add team member
  const addMutation = useMutation({
    mutationFn: (input: AddTrialTeamMemberInput) =>
      addTrialTeamMember(orgId, trialId, input),
    onSuccess: () => {
      // Invalidate team query
      queryClient.invalidateQueries({ queryKey });
      // Invalidate trial details (PI might have changed)
      queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
    },
  });

  // Mutation: update role
  const updateRoleMutation = useMutation({
    mutationFn: ({ orgMemberId, role }: { orgMemberId: string; role: TrialRole }) =>
      updateTrialTeamMember(orgId, trialId, orgMemberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Invalidate trial details (PI might have changed)
      queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
    },
  });

  // Mutation: update settings
  const updateSettingsMutation = useMutation({
    mutationFn: ({
      orgMemberId,
      settings,
    }: {
      orgMemberId: string;
      settings: { notes?: string; contact_info?: string; [key: string]: unknown };
    }) => updateTrialTeamMemberSettings(orgId, trialId, orgMemberId, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation: update status
  const updateStatusMutation = useMutation({
    mutationFn: ({
      orgMemberId,
      status,
    }: {
      orgMemberId: string;
      status: 'active' | 'inactive';
    }) => updateTrialTeamMemberStatus(orgId, trialId, orgMemberId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Mutation: remove member
  const removeMutation = useMutation({
    mutationFn: (orgMemberId: string) =>
      removeTrialTeamMember(orgId, trialId, orgMemberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      // Invalidate trial details (PI might have been removed)
      queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
    },
  });

  return {
    // Data
    teamMembers: data?.team_members || [],
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
      settings: { notes?: string; contact_info?: string; [key: string]: unknown }
    ) => updateSettingsMutation.mutateAsync({ orgMemberId, settings }),
    isUpdatingSettings: updateSettingsMutation.isPending,

    updateStatus: (orgMemberId: string, status: 'active' | 'inactive') =>
      updateStatusMutation.mutateAsync({ orgMemberId, status }),
    isUpdatingStatus: updateStatusMutation.isPending,

    removeMember: removeMutation.mutateAsync,
    isRemoving: removeMutation.isPending,
  };
}
