/**
 * Task Kanban Card
 * Split into SortableTaskCard (thin hook wrapper) + TaskKanbanCard (memoized presentation).
 * This prevents useSortable re-renders from cascading into the heavy UI component.
 */

"use client";

import { memo, useRef, useMemo } from "react";
import Link from "next/link";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskAssigneeSelect } from "./TaskAssigneeSelect";
import { formatDistanceToNow } from "date-fns";
import {
  MoreVertical,
  Edit,
  Trash2,
  ArrowRight,
  ExternalLink,
  Send,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { ROUTES } from "@/lib/routes";
import type { TaskWithContext, TaskStatus } from "@/services/tasks/types";
import type { TeamMember } from "@/services/client/teamMembers";

interface TaskKanbanCardProps {
  task: TaskWithContext;
  teamMembers: TeamMember[];
  orgId: string;
  onEdit: (task: TaskWithContext) => void;
  onDelete: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateAssignee: (taskId: string, userId: string | null) => void;
  onSend?: (task: TaskWithContext) => void;
  disabled?: boolean;
  isDragging?: boolean;
}

/**
 * Pure presentation component - memoized to prevent unnecessary re-renders.
 * Used directly in DragOverlay and wrapped by SortableTaskCard in columns.
 */
export const TaskKanbanCard = memo(function TaskKanbanCard({
  task,
  teamMembers,
  orgId,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateAssignee,
  onSend,
  disabled,
  isDragging,
}: TaskKanbanCardProps) {
  const isOverdue =
    task.due_date &&
    task.status !== "completed" &&
    new Date(task.due_date) < new Date();

  const suggestedRole = undefined;

  const jsx = (
    <div
      className={`group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md cursor-pointer ${
        isDragging ? "opacity-50 shadow-lg" : ""
      }`}
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
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            {onSend && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSend(task);
                }}
              >
                <Send className="h-4 w-4 mr-2" />
                Send
              </DropdownMenuItem>
            )}
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
                      onClick={() => onUpdateStatus(task.id, status.value)}
                    >
                      {status.label}
                    </DropdownMenuItem>
                  ),
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(task.id)}
              className="text-red-600"
            >
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
        {(task.category || task.activity_type?.category) && (
          <span
            className="inline-block px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
            title={`Category: ${task.category || task.activity_type?.category}`}
          >
            {task.category || task.activity_type?.category}
          </span>
        )}
      </div>

      {/* Patient Info */}
      {task.patient && task.patient_id && (
        <div className="mb-1">
          <Link
            href={ROUTES.APP.PATIENT_TAB(
              orgId,
              task.trial_id,
              task.patient_id,
              "overview",
            )}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <span>Patient: {task.patient.patient_number}</span>
            {task.patient.initials && <span>({task.patient.initials})</span>}
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </div>
      )}

      {/* Visit Info */}
      {task.visit && task.visit_id && task.patient_id && (
        <div className="mb-1">
          <Link
            href={ROUTES.APP.PATIENT_TAB(
              orgId,
              task.trial_id,
              task.patient_id,
              "visits",
            )}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            <span>Visit: {task.visit.visit_name}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
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

      {/* Assignee Select */}
      <div
        className="mt-2 pt-2 border-t border-gray-100"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <TaskAssigneeSelect
          value={task.assigned_to}
          suggestedRole={suggestedRole}
          teamMembers={teamMembers}
          onChange={(userId) => onUpdateAssignee(task.id, userId)}
          disabled={disabled}
          size="sm"
        />
      </div>
    </div>
  );

  return jsx;
});

export function SortableTaskCard(
  props: Omit<TaskKanbanCardProps, "isDragging">,
) {
  const { task, disabled, onEdit } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "Task", task },
    disabled,
  });

  // Click vs drag detection: track pointer start position
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const composedListeners = useMemo(
    () => ({
      ...listeners,
      onPointerDown: (e: React.PointerEvent) => {
        pointerStart.current = { x: e.clientX, y: e.clientY };
        listeners?.onPointerDown?.(e as any);
      },
    }),
    [listeners],
  );

  const handleCardClick = (e: React.MouseEvent) => {
    if (!pointerStart.current) return;
    const dist =
      Math.abs(e.clientX - pointerStart.current.x) +
      Math.abs(e.clientY - pointerStart.current.y);
    pointerStart.current = null;
    if (dist > 5) return;
    onEdit(task);
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="touch-none"
      {...attributes}
      {...composedListeners}
      onClick={handleCardClick}
    >
      <TaskKanbanCard {...props} isDragging={isDragging} />
    </div>
  );
}
