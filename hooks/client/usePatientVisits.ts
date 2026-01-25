/**
 * Patient Visits Hook
 * TanStack Query wrapper for patient visits API
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPatientVisits, completeVisit } from "@/services/client/visits";

/**
 * Hook to fetch patient visits with their activities
 */
export function usePatientVisits(
  orgId: string,
  trialId: string,
  patientId: string
) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["patient-visits", orgId, trialId, patientId],
    queryFn: () => getPatientVisits(orgId, trialId, patientId),
    staleTime: 30000, // 30 seconds
  });

  // Mutation to complete visit
  const completeMutation = useMutation({
    mutationFn: (visitId: string) =>
      completeVisit(orgId, trialId, patientId, visitId),
    onSuccess: () => {
      // Invalidate patient visits query to refresh
      queryClient.invalidateQueries({
        queryKey: ["patient-visits", orgId, trialId, patientId],
      });
    },
  });

  return {
    visits: data?.visits || [],
    total: data?.total || 0,
    isLoading,
    error: error as Error | null,
    completeVisit: completeMutation.mutateAsync,
    isCompletingVisit: completeMutation.isPending,
  };
}
