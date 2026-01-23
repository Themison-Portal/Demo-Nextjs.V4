'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '@/services/client/tasks';
import type {
  TaskFilters,
  CreateTaskInput,
  UpdateTaskInput,
} from '@/services/tasks/types';

/**
 * Flexible hook for tasks with CRUD operations
 * @param orgId - Organization ID
 * @param filters - Optional filters (trial_id, patient_id, assigned_to, status, priority)
 */
export function useTasks(orgId: string, filters?: TaskFilters) {
  const queryClient = useQueryClient();

  // Query for fetching tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ['client', 'tasks', orgId, filters],
    queryFn: () => getTasks(orgId, filters),
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(orgId, input),
    onSuccess: () => {
      // Invalidate all task queries for this org
      queryClient.invalidateQueries({
        queryKey: ['client', 'tasks', orgId],
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) =>
      updateTask(orgId, taskId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['client', 'tasks', orgId],
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(orgId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['client', 'tasks', orgId],
      });
    },
  });

  return {
    tasks: data?.tasks || [],
    total: data?.total || 0,
    isLoading,
    error,
    createTask: createMutation.mutateAsync,
    updateTask: (taskId: string, input: UpdateTaskInput) =>
      updateMutation.mutateAsync({ taskId, input }),
    deleteTask: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
