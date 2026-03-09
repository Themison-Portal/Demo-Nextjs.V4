/**
 * Patient Visits Hook
 * TanStack Query wrapper for patient visits API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { PatientVisit } from "@/services/visits/types";

/**
 * Hook to fetch patient visits with their activities
 */
export function usePatientVisits(
    orgId: string,
    trialId: string,
    patientId: string
) {
    const queryClient = useQueryClient();

    // Fetch patient visits
    const { data, isLoading, error } = useQuery({
        queryKey: ["patient-visits", orgId, trialId, patientId],
        queryFn: async (): Promise<PatientVisit[]> => {
            // Tell TypeScript this returns PatientVisit[]
            const visits = await apiClient.getPatientVisits(patientId);
            return visits as PatientVisit[];
        },
        enabled: !!orgId && !!trialId && !!patientId && patientId !== "__none__",
        staleTime: 30_000, // 30 seconds
    });

    // Mutation to complete a visit
    const completeMutation = useMutation({
        mutationFn: (visitId: string) =>
            apiClient.completeVisit(orgId, trialId, patientId, visitId),
        onSuccess: () => {
            // Invalidate query to refresh visits
            queryClient.invalidateQueries({
                queryKey: ["patient-visits", orgId, trialId, patientId],
            });
        },
    });

    return {
        visits: data || [],
        isLoading,
        error: error as Error | null,
        completeVisit: completeMutation.mutateAsync,
        isCompletingVisit: completeMutation.isPending,
    };
}