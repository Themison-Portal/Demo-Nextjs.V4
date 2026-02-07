"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "@/services/client/tasks";
import { toast } from "@/lib/toast";
import type {
  TaskFilters,
  TaskWithContext,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/services/tasks/types";

const EMPTY_TASKS: TaskWithContext[] = [];

/**
 * Flexible hook for tasks with CRUD operations
 * All filters are sent to the backend for server-side filtering
 * @param orgId - Organization ID
 * @param filters - Optional filters (trial_id, patient_id, assigned_to, status, priority, category)
 */
export function useTasks(orgId: string, filters?: TaskFilters) {
  const queryClient = useQueryClient();

  // Query for fetching tasks - all filters handled by backend
  const { data, isLoading, error } = useQuery({
    queryKey: ["client", "tasks", orgId, filters],
    queryFn: () => getTasks(orgId, filters),
    refetchOnWindowFocus: true,
    staleTime: 30000, // 30 seconds
  });

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
    tasks: data?.tasks ?? EMPTY_TASKS,
    allTasks: data?.tasks ?? EMPTY_TASKS,
    total: data?.total || 0,
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
