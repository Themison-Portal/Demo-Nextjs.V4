/**
 * Task Kanban Card
 * Compact vertical card for kanban board
 */

"use client";

import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskAssigneeSelect } from "./TaskAssigneeSelect";
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
import { TASK_STATUS_OPTIONS, TASK_STATUS_CONFIG } from "@/lib/constants/tasks";
import type { TaskWithContext, TaskStatus } from "@/services/tasks/types";
import type { TeamMember } from "@/services/client/teamMembers";

interface TaskKanbanCardProps {
  task: TaskWithContext;
  teamMembers: TeamMember[];
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: TaskStatus) => void;
  onUpdateAssignee: (userId: string | null) => void;
  disabled?: boolean;
}

export function TaskKanbanCard({
  task,
  teamMembers,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateAssignee,
  disabled,
}: TaskKanbanCardProps) {
  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date) < new Date();

  // TODO: Get suggested role from activity_type if task comes from visit schedule
  // For now, we don't have activity_type.assigned_to_role in TaskWithContext
  // This would require enhancing the backend query or types
  const suggestedRole = undefined;

  return (
    <div
      className="group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onEdit}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2 flex-1">
          {task.title}
        </h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
              disabled={disabled}
              onClick={(e) => e.stopPropagation()}
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
                {TASK_STATUS_OPTIONS.filter((s) => s.value !== task.status).map(
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

      {/* Badges: Priority, Trial, Activity Type */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {task.priority && (
          <TaskPriorityBadge priority={task.priority} size="sm" />
        )}
        {task.trial && (
          <span
            className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 max-w-[120px] truncate"
            title={task.trial.name}
          >
            {task.trial.name}
          </span>
        )}
        {task.activity_type?.category && (
          <span
            className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
            title={`Category: ${task.activity_type.category}`}
          >
            {task.activity_type.category}
          </span>
        )}
      </div>

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

      {/* Status with Quick Actions on Hover */}
      <div className="pt-2" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-flex">
          {/* Current Status Badge */}
          <div className="group/status relative inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
            <span className="whitespace-nowrap">
              {TASK_STATUS_CONFIG[task.status].label}
            </span>

            {/* Popover with Quick Actions (appears on hover, above everything) */}
            <div className="absolute bottom-full left-0 mb-1 opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all duration-200 z-50">
              <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-2 py-1.5">
                <div className="flex items-center gap-1">
                  {Object.entries(TASK_STATUS_CONFIG)
                    .filter(([status]) => status !== task.status)
                    .map(([status, config]) => {
                      const Icon = config.icon;
                      return (
                        <button
                          key={status}
                          onClick={() => onUpdateStatus(status as TaskStatus)}
                          disabled={disabled}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${config.color} whitespace-nowrap`}
                          title={config.label}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{config.label}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignee Select - Clickable */}
      <div
        className="mt-2 pt-2 border-t border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <TaskAssigneeSelect
          value={task.assigned_to}
          suggestedRole={suggestedRole}
          teamMembers={teamMembers}
          onChange={onUpdateAssignee}
          disabled={disabled}
          size="sm"
        />
      </div>
    </div>
  );
}
