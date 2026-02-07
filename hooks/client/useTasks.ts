"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/services/client/tasks";
import { toast } from "@/lib/toast";
import type {
  TaskFilters,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/services/tasks/types";

/**
 * Flexible hook for tasks with CRUD operations
 * Fetches all tasks once and filters on the client for better performance
 * @param orgId - Organization ID
 * @param filters - Optional filters (trial_id, patient_id, assigned_to, status, priority, category)
 */
export function useTasks(orgId: string, filters?: TaskFilters) {
  const queryClient = useQueryClient();

  // Only include assigned_to filter in backend query (needed for "me" filter)
  // All other filters are applied client-side
  const backendFilters = filters?.assigned_to
    ? { assigned_to: filters.assigned_to }
    : undefined;

  // Query for fetching tasks
  const { data, isLoading, error } = useQuery({
    queryKey: ["client", "tasks", orgId, backendFilters],
    queryFn: () => getTasks(orgId, backendFilters),
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });

  // Apply client-side filters
  const filteredTasks = useMemo(() => {
    if (!data?.tasks) return [];

    let result = data.tasks;

    // Filter by trial
    if (filters?.trial_id) {
      result = result.filter((task) => task.trial_id === filters.trial_id);
    }

    // Filter by patient
    if (filters?.patient_id) {
      result = result.filter((task) => task.patient_id === filters.patient_id);
    }

    // Filter by status
    if (filters?.status) {
      result = result.filter((task) => task.status === filters.status);
    }

    // Filter by priority
    if (filters?.priority) {
      result = result.filter((task) => task.priority === filters.priority);
    }

    // Filter by category (manual or activity_type category)
    if (filters?.category) {
      result = result.filter((task) => {
        const taskCategory = task.category || task.activity_type?.category;
        return taskCategory === filters.category;
      });
    }

    return result;
  }, [data?.tasks, filters]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(orgId, input),
    onSuccess: (data) => {
      // Invalidate all task queries for this org
      queryClient.invalidateQueries({
        queryKey: ["client", "tasks", orgId],
      });
      toast.success("Task created", data.title);
    },
    onError: (error: any) => {
      toast.error("Failed to create task", error.message || "Please try again");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({
      taskId,
      input,
    }: {
      taskId: string;
      input: UpdateTaskInput;
    }) => updateTask(orgId, taskId, input),
    onSuccess: (data, variables) => {
      // Invalidate task queries
      queryClient.invalidateQueries({
        queryKey: ["client", "tasks", orgId],
      });
      // Invalidate patient-visits queries (to refresh visit activities status)
      queryClient.invalidateQueries({
        queryKey: ["patient-visits"],
      });

      // Show success toast for status changes (especially completion)
      if (variables.input.status === "completed") {
        toast.success("Task completed", "Great work!");
      } else if (variables.input.status) {
        toast.success(
          "Task updated",
          `Status changed to ${variables.input.status.replace("_", " ")}`,
        );
      }
    },
    onError: (error: any) => {
      toast.error("Failed to update task", error.message || "Please try again");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (taskId: string) => deleteTask(orgId, taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["client", "tasks", orgId],
      });
      toast.success("Task deleted", "The task has been removed");
    },
    onError: (error: any) => {
      toast.error("Failed to delete task", error.message || "Please try again");
    },
  });

  // Memoize mutation functions to prevent unnecessary re-renders
  const createTaskFn = useCallback(
    (input: CreateTaskInput) => createMutation.mutateAsync(input),
    [createMutation.mutateAsync],
  );

  const updateTaskFn = useCallback(
    (taskId: string, input: UpdateTaskInput) =>
      updateMutation.mutateAsync({ taskId, input }),
    [updateMutation.mutateAsync],
  );

  const deleteTaskFn = useCallback(
    (taskId: string) => deleteMutation.mutateAsync(taskId),
    [deleteMutation.mutateAsync],
  );

  return {
    tasks: filteredTasks,
    allTasks: data?.tasks || [], // All tasks without client-side filters (for filter options)
    total: filteredTasks.length,
    isLoading,
    error,
    createTask: createTaskFn,
    updateTask: updateTaskFn,
    deleteTask: deleteTaskFn,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
