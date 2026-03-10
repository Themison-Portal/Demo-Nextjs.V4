import type {
    ActivityListResponse,
    TrialActivityListResponse,
    CreateTrialActivityInput,
    UpdateTrialActivityInput,
    TrialActivityType,
    ActivityMetadata,
} from "@/services/activities/types";

import { apiClient } from "@/lib/apiClient";

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
    if (category) params.set("category", category);

    const query = params.toString() ? `?${params.toString()}` : "";
    return apiClient.getTrialActivityTypes(trialId + query); // assuming apiClient exposes this endpoint
}

/**
 * Get trial-specific custom activities
 */
export async function getTrialActivities(
    trialId: string
): Promise<TrialActivityListResponse> {
    const activities = await apiClient.getTrialActivityTypes(trialId);
    return activities;
}

/**
 * Get combined activity metadata (global + trial-specific)
 */
export async function getActivityMetadata(
    trialId: string
): Promise<{ activities: ActivityMetadata[]; total: number }> {
    const trialActivities = await apiClient.getTrialActivityTypes(trialId); // trial-specific
    const activities: ActivityMetadata[] = trialActivities.activities.map(a => ({
        activity_id: a.activity_id,
        name: a.name,
        category: a.category,
        description: a.description,
        source: 'trial',
        is_custom: a.is_custom,
    }));

    return { activities, total: activities.length };
}

/**
 * Create a trial-specific custom activity
 */
export async function createTrialActivity(
    trialId: string,
    data: CreateTrialActivityInput
): Promise<TrialActivityType> {
    return apiClient.createTrialActivity(trialId, data);
}

/**
 * Update a trial-specific custom activity
 */
export async function updateTrialActivity(
    trialId: string,
    activityId: string,
    data: UpdateTrialActivityInput
): Promise<TrialActivityType> {
    return apiClient.updateTrialActivity(trialId, activityId, data);
}

/**
 * Delete a trial-specific custom activity (soft delete)
 */
export async function deleteTrialActivity(
    trialId: string,
    activityId: string
): Promise<void> {
    return apiClient.deleteTrialActivity(trialId, activityId);
}

/**
 * Create a visit
 */
export async function createVisit(payload: {
    patient_id: string;
    trial_id?: string;
    visit_template_name: string;
    visit_name: string;
    visit_order: number;
    days_from_day_zero?: number;
    is_day_zero?: boolean;
    scheduled_date: string;
    status?: string;
}): Promise<{ id: string }> {
    return apiClient.createVisit(payload);
}

/**
 * Create a visit activity
 */
export async function createVisitActivity(payload: {
    visit_id: string;
    activity_type_id: string;
    activity_name: string;
    activity_order: number;
    status?: string;
}): Promise<{ id: string }> {
    return apiClient.createVisitActivity(payload);
}

/**
 * Get a single trial activity by activity ID
 */
export async function getTrialActivityById(
    trialId: string,
    activityId: string
): Promise<TrialActivityType | null> {
    return apiClient.getTrialActivity(trialId, activityId);
}

/**
 * Get a global activity type by ID
 */
export async function getActivityTypeById(activityId: string) {
    return apiClient.getActivityType(activityId);
}