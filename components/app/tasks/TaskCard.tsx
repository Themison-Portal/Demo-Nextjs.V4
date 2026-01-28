/**
 * Task Card Component
 * Compact horizontal layout for task display
 */

import { Badge } from "@/components/ui/badge";
import type { TaskWithContext } from "@/services/tasks/types";
import { cn } from "@/lib/utils";
import { useFormattedTaskDate } from "@/hooks/ui/useFormattedTaskDate";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface TaskCardProps {
  task: TaskWithContext;
  orgId?: string;
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

export function TaskCard({ task, orgId }: TaskCardProps) {
  const router = useRouter();
  const statusConfig = statusVariants[task.status];
  const priorityColor = task.priority ? priorityColors[task.priority] : null;
  const dueDate = useFormattedTaskDate(task.due_date ?? null, task.status);

  // Only make clickable if task has patient and visit
  const isClickable = task.patient_id && task.visit_id && orgId;

  const handleClick = () => {
    if (!isClickable) return;

    // Navigate to patient visits tab with visitId as query param
    const url = `${ROUTES.APP.PATIENT_TAB(orgId, task.trial_id, task.patient_id!, "visits")}?visitId=${task.visit_id}`;
    router.push(url);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 bg-white border border-gray-200 rounded-md transition-colors",
        isClickable && "cursor-pointer hover:bg-gray-50 hover:border-gray-300",
        !isClickable && "cursor-default"
      )}
    >
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
        {task.trial?.name || "Unknown Trial"}
      </div>

      {/* Status Badge */}
      <Badge variant="outline" className={cn("shrink-0 text-xs", statusConfig.className)}>
        {statusConfig.label}
      </Badge>
    </div>
  );
}
