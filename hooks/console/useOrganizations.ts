'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { CreateOrganizationInput, Organization } from '@/services/organizations/types';

const ORGANIZATIONS_QUERY_KEY = ['console', 'organizations'];

export function useOrganizations() {
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ORGANIZATIONS_QUERY_KEY,
        queryFn: async (): Promise<Organization[]> => {
            const response = await apiClient.getOrganizations() as Organization[];
            return response ?? [];
        },
        staleTime: 1000 * 60 * 2,
    });

    const createMutation = useMutation({
        mutationFn: (input: CreateOrganizationInput) =>
            apiClient.createOrganization(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
        },
    });

    const stats = {
        total: data?.length || 0,
        active: data?.filter((org: Organization) => !org.deleted_at).length || 0,
        inactive: data?.filter((org: Organization) => org.deleted_at).length || 0,
        totalUsers:
            data?.reduce((sum: number, org: Organization) => sum + (org.member_count || 0), 0) || 0,
        totalTrials:
            data?.reduce((sum: number, org: Organization) => sum + (org.trial_count || 0), 0) || 0,
        activeTrials:
            data?.reduce((sum: number, org: Organization) => sum + (org.active_trial_count || 0), 0) || 0,
    };

    return {
        organizations: data || [],
        recentOrganizations: data?.slice(0, 3) || [],
        stats,
        isLoading,
        error: error as Error | null,
        refetch,
        createOrganization: createMutation.mutateAsync,
        isCreating: createMutation.isPending,
    };
}