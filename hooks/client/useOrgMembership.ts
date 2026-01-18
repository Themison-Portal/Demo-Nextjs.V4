/**
 * useOrgMembership Hook
 * Lightweight hook to get current user's membership in an organization
 * Used by usePermissions for org-level permission checks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyMembership, OrgMembership } from '@/services/client/organizations';

/**
 * Hook to get current user's org membership
 * Caches the result to avoid repeated API calls
 */
export function useOrgMembership(orgId: string) {
  const {
    data: membership,
    isLoading,
    error,
  } = useQuery<OrgMembership>({
    queryKey: ['client', 'membership', orgId],
    queryFn: () => getMyMembership(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes - membership rarely changes
  });

  return {
    membership,
    orgRole: membership?.orgRole ?? null,
    orgMemberId: membership?.orgMemberId ?? null,
    isStaff: membership?.isStaff ?? false,
    isLoading,
    error,
  };
}
