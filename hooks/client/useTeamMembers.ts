'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient'; // import your apiClient

const EMPTY_ARRAY: never[] = [];

/**
 * Hook to fetch team members from all trials the user has access to
 * @param orgId - Organization ID (not needed if apiClient already uses auth context)
 */
export function useTeamMembers() {
    const { data, isLoading, error } = useQuery({
        queryKey: ['teamMembers'],
        queryFn: () => apiClient.getTeamMembers(),
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