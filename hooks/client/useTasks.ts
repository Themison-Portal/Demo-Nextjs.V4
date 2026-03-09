"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { apiClient } from "@/lib/apiClient";
import { toast } from "@/lib/toast";

import type {
    TaskFilters,
    TaskWithContext,
    CreateTaskInput,
    UpdateTaskInput,
    TaskPayload,
} from "@/services/tasks/types";

const EMPTY_TASKS: TaskWithContext[] = [];

/**
 * Flexible hook for tasks with CRUD operations
 * All filters are sent to the backend for server-side filtering
 */
export function useTasks(filters?: TaskFilters) {
    const queryClient = useQueryClient();

    // -----------------------
    // Fetch tasks
    // -----------------------
    const { data, isLoading, error } = useQuery({
        queryKey: ["tasks", filters],
        queryFn: () => apiClient.getTasks(filters),
        refetchOnWindowFocus: true,
        staleTime: 30000,
    });

    // -----------------------
    // Create Task
    // -----------------------
    const createMutation = useMutation({
        mutationFn: (input: TaskPayload) =>
            apiClient.createTask({
                ...input,
                patient_id: input.patient_id ?? "", // convert undefined to empty string
            }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast.success("Task created", data.title);
        },
        onError: (error: any) => {
            toast.error("Failed to create task", error.message || "Please try again");
        },
    });

    // -----------------------
    // Update Task
    // -----------------------
    const updateMutation = useMutation({
        mutationFn: ({
            taskId,
            input,
        }: {
            taskId: string;
            input: UpdateTaskInput;
        }) => apiClient.updateTask(taskId, input),

        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            queryClient.invalidateQueries({ queryKey: ["patient-visits"] });

            if (variables.input.status === "completed") {
                toast.success("Task completed", "Great work!");
            } else if (variables.input.status) {
                toast.success(
                    "Task updated",
                    `Status changed to ${variables.input.status.replace("_", " ")}`
                );
            }
        },
        onError: (error: any) => {
            toast.error("Failed to update task", error.message || "Please try again");
        },
    });

    // -----------------------
    // Delete Task
    // -----------------------
    const deleteMutation = useMutation({
        mutationFn: (taskId: string) => apiClient.deleteTask(taskId),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });

            toast.success("Task deleted", "The task has been removed");
        },
        onError: (error: any) => {
            toast.error("Failed to delete task", error.message || "Please try again");
        },
    });

    // -----------------------
    // Memoized mutation helpers
    // -----------------------
    const createTaskFn = useCallback(
        (input: CreateTaskInput) => {
            // Map null -> undefined for patient_id
            const payload: TaskPayload = {
                trial_id: input.trial_id,
                patient_id: input.patient_id ?? undefined, // null → undefined
                visit_id: input.visit_id ?? "",           // convert null/undefined to empty string
                activity_type_id: input.activity_type_id ?? undefined,
                //category: string,
                title: input.title,
                //description: input.description ?? undefined,
                status: input.status,
                priority: input.priority ?? undefined,
                assigned_to: input.assigned_to ?? undefined,
                due_date: input.due_date ?? undefined,
            };

            return createMutation.mutateAsync(payload);
        },
        [createMutation]
    );

    const updateTaskFn = useCallback(
        (taskId: string, input: UpdateTaskInput) =>
            updateMutation.mutateAsync({ taskId, input }),
        [updateMutation]
    );

    const deleteTaskFn = useCallback(
        (taskId: string) => deleteMutation.mutateAsync(taskId),
        [deleteMutation]
    );

    return {
        tasks: data ?? EMPTY_TASKS,
        allTasks: data ?? EMPTY_TASKS,
        total: data?.length || 0,

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