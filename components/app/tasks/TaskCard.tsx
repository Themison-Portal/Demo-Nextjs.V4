/**
 * Task Card Component
 * Compact horizontal layout for task display
 */

import { Badge } from "@/components/ui/badge";
import type { TaskWithContext } from "@/services/tasks/types";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: TaskWithContext;
}

// Priority indicators
const priorityColors = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-blue-500",
  low: "bg-gray-400",
};

// Status badge variants
const statusVariants = {
  todo: { label: "To Do", className: "bg-gray-100 text-gray-700 border-gray-200" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Done", className: "bg-green-100 text-green-700 border-green-200" },
  blocked: { label: "Blocked", className: "bg-red-100 text-red-700 border-red-200" },
};

export function TaskCard({ task }: TaskCardProps) {
  const statusConfig = statusVariants[task.status];
  const priorityColor = priorityColors[task.priority];

  // Format due date
  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    const dueDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `Overdue by ${Math.abs(diffDays)}d`, isOverdue: true };
    if (diffDays === 0) return { text: "Due today", isOverdue: false };
    if (diffDays === 1) return { text: "Due tomorrow", isOverdue: false };
    return { text: `Due in ${diffDays}d`, isOverdue: false };
  };

  const dueDate = formatDueDate(task.due_date);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-gray-300 transition-colors">
      {/* Priority Indicator */}
      <div className={cn("w-1 h-8 rounded-full shrink-0", priorityColor)} />

      {/* Task Title */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
      </div>

      {/* Patient Info */}
      <div className="text-xs text-gray-600 shrink-0">
        {task.patient ? (
          <span>
            Patient {task.patient.patient_number}
            {task.patient.initials && ` (${task.patient.initials})`}
          </span>
        ) : (
          <span className="text-gray-400 italic">Manual</span>
        )}
      </div>

      {/* Visit Info */}
      {task.visit && (
        <div className="text-xs text-gray-600 shrink-0">
          <span className="text-gray-400 mr-1">·</span>
          Visit: {task.visit.visit_name}
        </div>
      )}

      {/* Due Date */}
      {dueDate && (
        <div className={cn(
          "text-xs shrink-0",
          dueDate.isOverdue && task.status !== 'completed'
            ? "text-red-600 font-medium"
            : "text-gray-600"
        )}>
          {dueDate.text}
        </div>
      )}

      {/* Trial Name */}
      <div className="text-xs text-gray-500 shrink-0 max-w-[120px] truncate">
        {task.trial.name}
      </div>

      {/* Status Badge */}
      <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig.className)}>
        {statusConfig.label}
      </Badge>
    </div>
  );
}
