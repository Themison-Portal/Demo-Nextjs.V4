'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { OrgMembership } from '@/services/organizations/types';
import { OrgRole } from '@/lib/permissions/constants';


interface ApiOrgMembershipResponse {
    user_id: string;
    email: string;
    member_id: string;
    org_role: string;
    is_staff?: boolean;
}

/**
 * Hook to get current user's org membership
 */
export function useOrgMembership(orgId: string) {
    const { data: membership, isLoading, error } = useQuery<OrgMembership, Error>({
        queryKey: ['org-membership', orgId],
        queryFn: async (): Promise<OrgMembership> => {
            const data = (await apiClient.getOrganization(orgId)) as ApiOrgMembershipResponse;

            return {
                userId: data.user_id,
                email: data.email,
                orgMemberId: data.member_id,
                orgRole: data.org_role as OrgRole,
                isStaff: data.is_staff ?? false,
            };
        },
        enabled: !!orgId,
        staleTime: 1000 * 60 * 5, // 5 minutes
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