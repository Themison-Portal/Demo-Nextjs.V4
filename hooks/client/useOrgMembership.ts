import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { OrgMembership } from '@/services/organizations/types';
import { OrgRole } from '@/lib/permissions/constants';

export function useOrgMembership(orgId: string) {
    const { data: membership, isLoading, error } = useQuery<OrgMembership, Error>({
        queryKey: ['org-membership', orgId],
        queryFn: async (): Promise<OrgMembership> => {
            const data = await apiClient.getMemberMe(); // hits /api/members/me
            return {
                userId: data.profile_id ?? data.id,
                email: data.email,
                orgMemberId: data.id,
                orgRole: data.default_role as OrgRole,
                isStaff: data.default_role === 'staff',
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