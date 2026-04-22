'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import type { VisitScheduleTemplate } from '@/services/visits/types';

export function useVisitTemplate(trialId: string) {
    const queryClient = useQueryClient();
    const queryKey = ['trial-template', trialId];

    const { data, isLoading, error } = useQuery({
        queryKey,
        queryFn: () => apiClient.getVisitTemplate(trialId),
        enabled: !!trialId,
    });

    const updateMutation = useMutation({
        mutationFn: (template: VisitScheduleTemplate) =>
            apiClient.updateVisitTemplate(trialId, template),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
            queryClient.invalidateQueries({
                queryKey: ['trial', trialId],
            });
        },
    });

    return {
        template: data || null,
        hasTemplate: !!data,
        isLoading,
        error,
        updateTemplate: updateMutation.mutateAsync,
        isUpdating: updateMutation.isPending,
        updateError: updateMutation.error,
    };
}
