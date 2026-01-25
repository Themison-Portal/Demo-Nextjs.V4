'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTeamMembers } from '@/services/client/teamMembers';

const EMPTY_ARRAY: never[] = [];

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

  const teamMembers = useMemo(
    () => data?.team_members ?? EMPTY_ARRAY,
    [data?.team_members]
  );

  return {
    teamMembers,
    isLoading,
    error,
  };
}
