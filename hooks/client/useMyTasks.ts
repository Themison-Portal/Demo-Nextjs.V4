'use client';

import { useQuery } from '@tanstack/react-query';
import { getMyTasks } from '@/services/client/tasks';

export function useMyTasks() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: getMyTasks,
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });

  return {
    tasks: data?.tasks || [],
    total: data?.total || 0,
    isLoading,
    error,
  };
}
