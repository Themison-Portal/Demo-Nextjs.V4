/**
 * Task Priority Badge
 * Visual indicator for task priority
 */

import { cn } from "@/lib/utils";
import type { TaskPriority } from "@/services/tasks/types";

interface TaskPriorityBadgeProps {
  priority: TaskPriority;
  size?: "sm" | "md";
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> =
  {
    urgent: {
      label: "Urgent",
      color: "bg-red-500 text-red-100 border-red-200",
    },
    high: {
      label: "High",
      color: "bg-orange-500 text-orange-100 border-orange-200",
    },
    medium: {
      label: "Medium",
      color: "bg-blue-500 text-blue-100 border-blue-200",
    },
    low: { label: "Low", color: "bg-gray-500 text-white border-gray-200" },
  };

export function TaskPriorityBadge({
  priority,
  size = "md",
}: TaskPriorityBadgeProps) {
  const config = PRIORITY_CONFIG[priority];

  return (
    <span
      className={cn(
        "inline-flex items-center border font-medium rounded-xl",
        config.color,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      )}
    >
      {config.label}
    </span>
  );
}
