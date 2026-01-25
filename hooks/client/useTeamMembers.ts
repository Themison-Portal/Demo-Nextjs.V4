'use client';

import { useQuery } from '@tanstack/react-query';
import { getTeamMembers } from '@/services/client/teamMembers';

/**
 * Hook to fetch team members from all trials the user has access to
 * @param orgId - Organization ID
 * @param trialId - Optional filter by specific trial
 */
export function useTeamMembers(orgId: string, trialId?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['client', 'team-members', orgId, trialId],
    queryFn: () => getTeamMembers(orgId, trialId),
    staleTime: 60000, // 1 minute - team members don't change often
  });

  return {
    teamMembers: data?.team_members || [],
    isLoading,
    error,
  };
}
