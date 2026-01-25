/**
 * useFormattedTaskDate - Custom hook for formatting task due dates
 * Handles date formatting logic for individual tasks
 */

import { useMemo } from "react";
import type { TaskStatus } from "@/services/tasks/types";

interface FormattedDate {
  text: string;
  isOverdue: boolean;
}

export function useFormattedTaskDate(
  dueDate: string | null,
  status: TaskStatus
): FormattedDate | null {
  return useMemo(() => {
    // For completed tasks, don't show due date info
    if (status === "completed") {
      return null;
    }

    if (!dueDate) return null;

    const dueDateObj = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDateObj.setHours(0, 0, 0, 0);
    const diffTime = dueDateObj.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0)
      return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
    if (diffDays === 0) return { text: "Due today", isOverdue: false };
    if (diffDays === 1) return { text: "Due tomorrow", isOverdue: false };
    return { text: `Due in ${diffDays}d`, isOverdue: false };
  }, [dueDate, status]);
}
