/**
 * Organizations Hook
 * Connects organization service to React components
 * Uses TanStack Query for caching and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrganizations,
  createOrganization,
  type Organization,
  type CreateOrganizationInput,
} from '@/services/organizations';

const ORGANIZATIONS_QUERY_KEY = ['organizations'];

export function useOrganizations() {
  const queryClient = useQueryClient();

  // Query all organizations
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ORGANIZATIONS_QUERY_KEY,
    queryFn: async () => {
      const response = await getOrganizations();
      return response.organizations;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Create organization mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateOrganizationInput) => createOrganization(input),
    onSuccess: () => {
      // Invalidate and refetch organizations list
      queryClient.invalidateQueries({ queryKey: ORGANIZATIONS_QUERY_KEY });
    },
  });

  // Calculate stats from organizations
  const stats = {
    total: data?.length || 0,
    active: data?.filter((org) => !org.deleted_at).length || 0,
    inactive: data?.filter((org) => org.deleted_at).length || 0,
    totalUsers: data?.reduce((sum, org) => sum + (org.member_count || 0), 0) || 0,
    totalTrials: data?.reduce((sum, org) => sum + (org.trial_count || 0), 0) || 0,
    activeTrials: data?.reduce((sum, org) => sum + (org.active_trial_count || 0), 0) || 0,
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
