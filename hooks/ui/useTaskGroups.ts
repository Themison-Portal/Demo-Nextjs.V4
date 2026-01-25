/**
 * useTaskGroups - Custom hook for grouping tasks by date
 * Used for the "All Time" view to group tasks into categories
 */

import { useState, useMemo } from "react";
import type { TaskWithContext } from "@/services/tasks/types";

export interface TaskGroups {
  overdue: TaskWithContext[];
  today: TaskWithContext[];
  tomorrow: TaskWithContext[];
  thisWeek: TaskWithContext[];
  upcoming: TaskWithContext[];
}

export function useTaskGroups(tasks: TaskWithContext[], enabled: boolean = true) {
  const [expandedGroups, setExpandedGroups] = useState({
    overdue: true,
    today: true,
    tomorrow: true,
    thisWeek: true,
    upcoming: true,
  });

  const toggleGroup = (group: keyof typeof expandedGroups) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  // Group tasks by date category
  const groups = useMemo<TaskGroups | null>(() => {
    if (!enabled) {
      return null; // No grouping needed
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const endOfWeek = new Date(today);
    const daysUntilSunday = 7 - today.getDay();
    endOfWeek.setDate(today.getDate() + daysUntilSunday);

    const grouped: TaskGroups = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      upcoming: [],
    };

    tasks.forEach((task) => {
      if (!task.due_date) {
        grouped.upcoming.push(task);
        return;
      }

      const taskDate = new Date(task.due_date);
      const taskDay = new Date(
        taskDate.getFullYear(),
        taskDate.getMonth(),
        taskDate.getDate()
      );

      if (taskDay.getTime() < today.getTime()) {
        grouped.overdue.push(task);
      } else if (taskDay.getTime() === today.getTime()) {
        grouped.today.push(task);
      } else if (taskDay.getTime() === tomorrow.getTime()) {
        grouped.tomorrow.push(task);
      } else if (taskDay.getTime() <= endOfWeek.getTime()) {
        grouped.thisWeek.push(task);
      } else {
        grouped.upcoming.push(task);
      }
    });

    return grouped;
  }, [tasks, enabled]);

  return {
    groups,
    expandedGroups,
    toggleGroup,
  };
}
