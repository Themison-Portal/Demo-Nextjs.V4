/**
 * useOrgMembership Hook
 * Lightweight hook to get current user's membership in an organization
 * Used by usePermissions for org-level permission checks
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import type { OrgMembership } from '@/services/client/organizations';

/**
 * Hook to get current user's org membership
 */
export function useOrgMembership(orgId: string) {
    const {
        data: membership,
        isLoading,
        error,
    } = useQuery<OrgMembership>({
        queryKey: ['org-membership', orgId],

        queryFn: async () => {
            const data = await apiClient.getOrganization(orgId);

            return {
                userId: data.user_id,
                email: data.email,
                orgMemberId: data.member_id,
                orgRole: data.org_role,
                isStaff: data.is_staff ?? false,
            };
        },

        enabled: !!orgId,
        staleTime: 1000 * 60 * 5,
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