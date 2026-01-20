'use client';

import { useQuery } from '@tanstack/react-query';
import { getActivityTypes } from '@/services/client/activities';
import type { ActivityCategory } from '@/services/activities/types';

/**
 * Hook para obtener el catálogo de activity types
 * Opcionalmente filtrado por categoría
 */
export function useActivityTypes(
  orgId: string,
  trialId: string,
  category?: ActivityCategory
) {
  const queryKey = ['client', 'activity-types', orgId, trialId, category];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getActivityTypes(orgId, trialId, category),
    enabled: !!orgId && !!trialId,
    // Cache for longer since activity catalog doesn't change often
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
 * Hook para obtener las categorías únicas de activities
 * Útil para filtros en UI
 */
export function useActivityCategories(orgId: string, trialId: string) {
  const { activities, isLoading, error } = useActivityTypes(orgId, trialId);

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
