/**
 * Task Constants
 * Centralized definitions for task-related enums and options
 */

import type { TaskStatus, TaskPriority } from "@/services/tasks/types";
import {
  Circle,
  Play,
  CheckCircle,
  XCircle,
  type LucideIcon,
} from "lucide-react";

// ============================================================================
// STATUS
// ============================================================================

export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  BLOCKED: "blocked",
} as const;

export const TASK_STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    icon: LucideIcon;
    color: string;
  }
> = {
  todo: {
    label: "To Do",
    icon: Circle,
    color: "text-gray-600 hover:bg-gray-50",
  },
  in_progress: {
    label: "In Progress",
    icon: Play,
    color: "text-blue-600 hover:bg-blue-50",
  },
  completed: {
    label: "Done",
    icon: CheckCircle,
    color: "text-green-600 hover:bg-green-50",
  },
  blocked: {
    label: "Block",
    icon: XCircle,
    color: "text-red-600 hover:bg-red-50",
  },
};

// ============================================================================
// PRIORITY
// ============================================================================

export const TASK_PRIORITY = {
  URGENT: "urgent",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

// ============================================================================
// CATEGORY
// ============================================================================

export const TASK_CATEGORIES = [
  "Laboratory",
  "Clinical",
  "Administrative",
  "Data Management",
  "Nursing",
  "Pharmacy",
  "Monitoring",
] as const;

export type TaskCategory = typeof TASK_CATEGORIES[number];

export const TASK_CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: "Laboratory", label: "Laboratory" },
  { value: "Clinical", label: "Clinical" },
  { value: "Administrative", label: "Administrative" },
  { value: "Data Management", label: "Data Management" },
  { value: "Nursing", label: "Nursing" },
  { value: "Pharmacy", label: "Pharmacy" },
  { value: "Monitoring", label: "Monitoring" },
];
