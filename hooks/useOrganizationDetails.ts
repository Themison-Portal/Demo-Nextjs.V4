import { apiClient } from "@/lib/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface UpdateOrgPayload {
    name?: string;
    settings?: any;
}

export function useOrganizationDetails(orgId?: string) {
    const queryClient = useQueryClient();

    // ✅ Wrap apiClient call to match queryFn signature
    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["organization", orgId],
        queryFn: () => apiClient.getOrganization(orgId), // pass id here
        staleTime: 1000 * 60 * 2,
        enabled: !!orgId, // only fetch if orgId exists
    });

    // ✅ Wrap mutationFn to pass orgId
    const updateMutation = useMutation({
        mutationFn: (payload: UpdateOrgPayload) => apiClient.updateOrganization(payload, orgId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organization", orgId] });
        },
    });

    return {
        organization: data || null,
        isLoading,
        error: error as Error | null,
        refetch,
        updateOrganization: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
    };
}