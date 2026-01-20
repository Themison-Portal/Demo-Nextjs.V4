import type { ActivityListResponse } from "@/services/activities/types";

/**
 * Get activity types catalog
 * Optionally filter by category
 */
export async function getActivityTypes(
  orgId: string,
  trialId: string,
  category?: string
): Promise<ActivityListResponse> {
  const params = new URLSearchParams();
  if (category) {
    params.set("category", category);
  }

  const url = `/api/client/${orgId}/trials/${trialId}/activities${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch activity types");
  }

  return response.json();
}
