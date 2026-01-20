'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getVisitTemplate,
  updateVisitTemplate,
} from '@/services/client/templates';
import type { VisitScheduleTemplate } from '@/services/visits/types';

/**
 * Hook para obtener y actualizar el visit schedule template de un trial
 */
export function useVisitTemplate(orgId: string, trialId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['client', 'template', orgId, trialId];

  // Query para obtener el template
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getVisitTemplate(orgId, trialId),
    enabled: !!orgId && !!trialId,
  });

  // Mutation para actualizar el template
  const updateMutation = useMutation({
    mutationFn: (template: VisitScheduleTemplate) =>
      updateVisitTemplate(orgId, trialId, template),
    onSuccess: () => {
      // Invalidar cache del template
      queryClient.invalidateQueries({ queryKey });
      // Invalidar cache del trial (por si se muestra info del template allí)
      queryClient.invalidateQueries({ queryKey: ['client', 'trial', orgId, trialId] });
    },
  });

  return {
    template: data?.template || null,
    hasTemplate: !!data?.template,
    isLoading,
    error,
    updateTemplate: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
  };
}
