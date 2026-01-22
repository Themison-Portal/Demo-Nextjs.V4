/**
 * Patient Visits Hook
 * TanStack Query wrapper for patient visits API
 */

import { useQuery } from "@tanstack/react-query";
import { getPatientVisits } from "@/services/client/visits";

/**
 * Hook to fetch patient visits with their activities
 */
export function usePatientVisits(
  orgId: string,
  trialId: string,
  patientId: string
) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["patient-visits", orgId, trialId, patientId],
    queryFn: () => getPatientVisits(orgId, trialId, patientId),
    staleTime: 30000, // 30 seconds
  });

  return {
    visits: data?.visits || [],
    total: data?.total || 0,
    isLoading,
    error: error as Error | null,
  };
}
