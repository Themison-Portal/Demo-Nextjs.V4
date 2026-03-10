'use client';

import { useQuery } from '@tanstack/react-query';
import { getTrialActivities } from '@/services/client/activities';
import type { ActivityCategory } from '@/services/activities/types';

/**
 * Hook to fetch trial-specific activity types
 * Optionally filtered by category
 */
export function useActivityTypes(trialId: string, category?: ActivityCategory) {
    const queryKey = ['activity-types', trialId, category];

    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: async () => {
            const activities = await getTrialActivities(trialId);

            if (!activities) return { activities: [], total: 0 };

            const filtered = category
                ? activities.filter((a) => a.category === category)
                : activities;

            return { activities: filtered, total: filtered.length };
        },
        enabled: !!trialId,
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    return {
        activities: data?.activities || [],
        total: data?.total || 0,
        isLoading,
        error,
    };
}

/**
 * Hook to get unique activity categories
 */
export function useActivityCategories(trialId: string) {
    const { activities, isLoading, error } = useActivityTypes(trialId);

    const categories = Array.from(
        new Set(
            activities
                .map((a) => a.category)
                .filter((c): c is ActivityCategory => c !== null && c !== undefined)
        )
    ).sort();

    return {
        categories,
        isLoading,
        error,
    };
}