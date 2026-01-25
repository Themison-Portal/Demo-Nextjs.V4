/**
 * Client-side visit services
 * Pure functions that call backend API endpoints
 */

import type { VisitWithActivities } from "@/services/visits/types";

export interface GetPatientVisitsResponse {
  visits: VisitWithActivities[];
  total: number;
}

/**
 * Get all visits for a patient with their activities
 */
export async function getPatientVisits(
  orgId: string,
  trialId: string,
  patientId: string
): Promise<GetPatientVisitsResponse> {
  const res = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients/${patientId}/visits`,
    {
      method: "GET",
      credentials: "include",
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to fetch patient visits: ${res.status}`);
  }

  return res.json();
}

/**
 * Manually complete a visit
 * Only PI/CRC can complete visits (critical clinical milestone)
 * Validates that all activities are completed or not_applicable
 */
export async function completeVisit(
  orgId: string,
  trialId: string,
  patientId: string,
  visitId: string
): Promise<{ visit: VisitWithActivities; message: string }> {
  const res = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients/${patientId}/visits/${visitId}/complete`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `Failed to complete visit: ${res.status}`);
  }

  return res.json();
}
