import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

import type {
    OrganizationDetails,
    OrganizationMember,
    Invitation,
    UpdateOrganizationInput,
    AddMemberInput,
} from "@/services/organizations/types";

export function useOrganizationDetails(orgId: string) {
    const queryClient = useQueryClient();

    // Fetch organization
    const orgQuery = useQuery({
        queryKey: ["organization", orgId],
        queryFn: () => apiClient.getOrganization(orgId),
        enabled: Boolean(orgId),
    });

    // Update organization
    const updateMutation = useMutation({
        mutationFn: (payload: UpdateOrganizationInput) =>
            apiClient.updateOrganization(payload, orgId),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["organization", orgId],
            });
        },
    });

    // Invite member
    const inviteMutation = useMutation({
        mutationFn: (payload: AddMemberInput) =>
            apiClient.inviteMemberToOrganization({ email: payload.email, org_role: payload.org_role }),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["organization", orgId],
            });
        },
    });

    // Remove member
    const removeMutation = useMutation({
        mutationFn: (userId: string) =>
            apiClient.removeMember(userId),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["organization", orgId],
            });
        },
    });

    const organization = orgQuery.data as OrganizationDetails | undefined;

    return {
        organization: organization ?? null,

        members: organization?.members ?? [],
        invitations: organization?.invitations ?? [],

        isLoading: orgQuery.isLoading,
        error: orgQuery.error ?? null,
        refetch: orgQuery.refetch,

        updateOrganization: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,

        inviteMember: inviteMutation.mutateAsync,
        isInviting: inviteMutation.isPending,

        removeMember: removeMutation.mutateAsync,
        isRemoving: removeMutation.isPending,
    };
}