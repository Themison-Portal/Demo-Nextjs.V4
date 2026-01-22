import type {
  ActivityListResponse,
  TrialActivityListResponse,
  CreateTrialActivityInput,
  UpdateTrialActivityInput,
  TrialActivityType,
  ActivityMetadata,
} from "@/services/activities/types";

/**
 * Get global activity types catalog
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

/**
 * Get trial-specific custom activities
 */
export async function getTrialActivities(
  orgId: string,
  trialId: string
): Promise<TrialActivityListResponse> {
  const url = `/api/client/${orgId}/trials/${trialId}/activities/trial`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch trial activities");
  }

  return response.json();
}

/**
 * Get combined activity metadata (global + trial-specific)
 * Used in UI to show all available activities for a trial
 */
export async function getActivityMetadata(
  orgId: string,
  trialId: string
): Promise<{ activities: ActivityMetadata[]; total: number }> {
  const url = `/api/client/${orgId}/trials/${trialId}/activities/metadata`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch activity metadata");
  }

  return response.json();
}

/**
 * Create a trial-specific custom activity
 */
export async function createTrialActivity(
  orgId: string,
  trialId: string,
  data: CreateTrialActivityInput
): Promise<TrialActivityType> {
  const url = `/api/client/${orgId}/trials/${trialId}/activities/trial`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create trial activity");
  }

  return response.json();
}

/**
 * Update a trial-specific custom activity
 */
export async function updateTrialActivity(
  orgId: string,
  trialId: string,
  activityId: string,
  data: UpdateTrialActivityInput
): Promise<TrialActivityType> {
  const url = `/api/client/${orgId}/trials/${trialId}/activities/trial/${activityId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update trial activity");
  }

  return response.json();
}

/**
 * Delete a trial-specific custom activity (soft delete)
 */
export async function deleteTrialActivity(
  orgId: string,
  trialId: string,
  activityId: string
): Promise<void> {
  const url = `/api/client/${orgId}/trials/${trialId}/activities/trial/${activityId}`;

  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete trial activity");
  }
}
