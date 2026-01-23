/**
 * Task Kanban Card
 * Compact vertical card for kanban board
 */

'use client';

import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { formatDistanceToNow } from "date-fns";
import { MoreVertical, Edit, Trash2, ArrowRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { TaskWithContext, TaskStatus } from "@/services/tasks/types";

interface TaskKanbanCardProps {
  task: TaskWithContext;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: TaskStatus) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

export function TaskKanbanCard({
  task,
  onEdit,
  onDelete,
  onUpdateStatus,
  disabled,
}: TaskKanbanCardProps) {
  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date) < new Date();

  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4
          className="text-sm font-medium text-gray-900 line-clamp-2 flex-1"
          onClick={onEdit}
        >
          {task.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              disabled={disabled}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ArrowRight className="h-4 w-4 mr-2" />
                Move to
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {STATUS_OPTIONS.filter((s) => s.value !== task.status).map(
                  (status) => (
                    <DropdownMenuItem
                      key={status.value}
                      onClick={() => onUpdateStatus(status.value)}
                    >
                      {status.label}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Priority */}
      {task.priority && (
        <div className="mb-2">
          <TaskPriorityBadge priority={task.priority} size="sm" />
        </div>
      )}

      {/* Patient Info */}
      {task.patient && (
        <div className="text-xs text-gray-600 mb-1">
          Patient: {task.patient.patient_number}
          {task.patient.initials && ` (${task.patient.initials})`}
        </div>
      )}

      {/* Visit Info */}
      {task.visit && (
        <div className="text-xs text-gray-600 mb-1">
          Visit: {task.visit.visit_name}
        </div>
      )}

      {/* Due Date */}
      {task.due_date && (
        <div
          className={`text-xs ${
            isOverdue ? "text-red-600 font-medium" : "text-gray-500"
          }`}
        >
          {isOverdue ? "Overdue: " : "Due: "}
          {formatDistanceToNow(new Date(task.due_date), { addSuffix: true })}
        </div>
      )}

      {/* Assigned User */}
      {task.assigned_user && (
        <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">
          Assigned to: {task.assigned_user.full_name || task.assigned_user.email}
        </div>
      )}
    </div>
  );
}
