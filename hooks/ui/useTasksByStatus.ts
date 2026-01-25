/**
 * useTasksByStatus - Custom hook for grouping and sorting tasks by status
 * Used for Kanban board view
 */

import { useMemo } from "react";
import type { TaskWithContext, TaskStatus } from "@/services/tasks/types";

export function useTasksByStatus(tasks: TaskWithContext[]) {
  return useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithContext[]> = {
      todo: [],
      in_progress: [],
      completed: [],
      blocked: [],
    };

    // Group tasks by status
    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    // Sort each status group by due_date (oldest first, nulls last)
    Object.keys(grouped).forEach((status) => {
      grouped[status as TaskStatus].sort((a, b) => {
        // Tasks without due_date go to the end
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;

        // Compare dates: older dates first
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });
    });

    return grouped;
  }, [tasks]);
}
