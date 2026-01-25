/**
 * useTaskFilters - Custom hook for task filtering logic
 * Handles all filter state and application logic for tasks
 */

import { useState, useMemo, useEffect } from "react";
import type { TaskWithContext, TaskStatus, TaskFilters } from "@/services/tasks/types";

export type DateFilter = "all" | "overdue" | "today" | "tomorrow";

interface UseTaskFiltersOptions {
  tasks: TaskWithContext[];
  excludeCompleted?: boolean;
  initialStatusFilter?: TaskStatus | "all";
  initialDateFilter?: DateFilter;
}

export function useTaskFilters({
  tasks,
  excludeCompleted = false,
  initialStatusFilter = "all",
  initialDateFilter = "today",
}: UseTaskFiltersOptions) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(initialStatusFilter);
  const [trialFilter, setTrialFilter] = useState<string | "all">("all");
  const [activityFilter, setActivityFilter] = useState<string | "all">("all");
  const [patientFilter, setPatientFilter] = useState<string | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>(initialDateFilter);
  const [dateFilterInitialized, setDateFilterInitialized] = useState(false);

  // Set initial date filter based on overdue tasks (excluding completed)
  useEffect(() => {
    if (!dateFilterInitialized && tasks.length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const hasOverdue = tasks.some((task) => {
        if (excludeCompleted && task.status === "completed") return false;
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        const taskDay = new Date(
          taskDate.getFullYear(),
          taskDate.getMonth(),
          taskDate.getDate()
        );
        return taskDay.getTime() < today.getTime();
      });

      if (hasOverdue) {
        setDateFilter("overdue");
      }
      setDateFilterInitialized(true);
    }
  }, [tasks, dateFilterInitialized, excludeCompleted]);

  // Extract unique options for filters
  const filterOptions = useMemo(() => {
    const trials = Array.from(
      new Map(
        tasks
          .filter((t) => t.trial)
          .map((t) => [t.trial_id, { id: t.trial_id, name: t.trial!.name }])
      ).values()
    );

    const activityTypes = Array.from(
      new Map(
        tasks
          .filter((t) => t.activity_type)
          .map((t) => [
            t.activity_type_id,
            { id: t.activity_type_id!, name: t.activity_type!.name },
          ])
      ).values()
    );

    const patients = Array.from(
      new Map(
        tasks
          .filter((t) => t.patient && t.patient_id)
          .map((t) => [
            t.patient_id,
            {
              id: t.patient_id!,
              patient_number: t.patient!.patient_number,
              initials: t.patient!.initials,
            },
          ])
      ).values()
    );

    return { trials, activityTypes, patients };
  }, [tasks]);

  // Apply all filters
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Exclude completed tasks if specified
    if (excludeCompleted) {
      result = result.filter((task) => task.status !== "completed");
    }

    // Filter by trial
    if (trialFilter !== "all") {
      result = result.filter((task) => task.trial_id === trialFilter);
    }

    // Filter by activity type
    if (activityFilter !== "all") {
      result = result.filter((task) => task.activity_type_id === activityFilter);
    }

    // Filter by patient
    if (patientFilter !== "all") {
      result = result.filter((task) => task.patient_id === patientFilter);
    }

    // Filter by date
    if (dateFilter !== "all" && result.length > 0) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (dateFilter === "overdue") {
        result = result.filter((task) => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const taskDay = new Date(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate()
          );
          return taskDay.getTime() < today.getTime();
        });
      } else if (dateFilter === "today") {
        result = result.filter((task) => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const taskDay = new Date(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate()
          );
          return taskDay.getTime() === today.getTime();
        });
      } else if (dateFilter === "tomorrow") {
        result = result.filter((task) => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const taskDay = new Date(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate()
          );
          return taskDay.getTime() === tomorrow.getTime();
        });
      }
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    return result;
  }, [
    tasks,
    excludeCompleted,
    trialFilter,
    activityFilter,
    patientFilter,
    dateFilter,
    statusFilter,
  ]);

  // Calculate status counts (before status filter is applied)
  const statusCounts = useMemo(() => {
    let baseTasks = tasks;

    // Exclude completed if specified
    if (excludeCompleted) {
      baseTasks = baseTasks.filter((task) => task.status !== "completed");
    }

    // Apply trial, activity, patient, date filters
    if (trialFilter !== "all") {
      baseTasks = baseTasks.filter((task) => task.trial_id === trialFilter);
    }
    if (activityFilter !== "all") {
      baseTasks = baseTasks.filter((task) => task.activity_type_id === activityFilter);
    }
    if (patientFilter !== "all") {
      baseTasks = baseTasks.filter((task) => task.patient_id === patientFilter);
    }
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      if (dateFilter === "overdue") {
        baseTasks = baseTasks.filter((task) => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const taskDay = new Date(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate()
          );
          return taskDay.getTime() < today.getTime();
        });
      } else if (dateFilter === "today") {
        baseTasks = baseTasks.filter((task) => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const taskDay = new Date(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate()
          );
          return taskDay.getTime() === today.getTime();
        });
      } else if (dateFilter === "tomorrow") {
        baseTasks = baseTasks.filter((task) => {
          if (!task.due_date) return false;
          const taskDate = new Date(task.due_date);
          const taskDay = new Date(
            taskDate.getFullYear(),
            taskDate.getMonth(),
            taskDate.getDate()
          );
          return taskDay.getTime() === tomorrow.getTime();
        });
      }
    }

    return {
      all: baseTasks.length,
      todo: baseTasks.filter((t) => t.status === "todo").length,
      in_progress: baseTasks.filter((t) => t.status === "in_progress").length,
      completed: baseTasks.filter((t) => t.status === "completed").length,
      blocked: baseTasks.filter((t) => t.status === "blocked").length,
    };
  }, [tasks, excludeCompleted, trialFilter, activityFilter, patientFilter, dateFilter]);

  return {
    // Filter state
    statusFilter,
    trialFilter,
    activityFilter,
    patientFilter,
    dateFilter,

    // Filter setters
    setStatusFilter,
    setTrialFilter,
    setActivityFilter,
    setPatientFilter,
    setDateFilter,

    // Filtered results
    filteredTasks,
    statusCounts,
    filterOptions,
  };
}
