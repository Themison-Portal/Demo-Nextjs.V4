/**
 * Task Status Column
 * A single column in the kanban board.
 * Each column has its own SortableContext + useDroppable for cross-column DnD.
 */

"use client";

import { useMemo } from "react";
import { SortableTaskCard } from "./TaskKanbanCard";
import { TaskCardSkeleton } from "./TaskCardSkeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { TaskStatus, TaskWithContext } from "@/services/tasks/types";
import type { TeamMember } from "@/services/client/teamMembers";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface TaskStatusColumnProps {
  status: TaskStatus;
  title: string;
  tasks: TaskWithContext[];
  teamMembers: TeamMember[];
  orgId: string;
  onAddTask: () => void;
  onEditTask: (task: TaskWithContext) => void;
  onSendTask?: (task: TaskWithContext) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateAssignee: (taskId: string, userId: string | null) => void;
  isUpdating: boolean;
  isLoading?: boolean;
  bgColor?: string;
  bgColorHeader?: string;
  textColorHeader?: string;
}

export function TaskStatusColumn({
  status,
  title,
  tasks,
  teamMembers,
  orgId,
  onAddTask,
  onEditTask,
  onSendTask,
  onDeleteTask,
  onUpdateStatus,
  onUpdateAssignee,
  isUpdating,
  isLoading = false,
  bgColor,
  bgColorHeader,
  textColorHeader,
}: TaskStatusColumnProps) {
  // Make column droppable (needed for dropping into empty columns)
  const { setNodeRef } = useDroppable({
    id: status,
  });

  // Memoize task IDs to prevent SortableContext from re-rendering children unnecessarily
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-full h-full rounded-lg border border-gray-200 ${
        bgColor ? bgColor : "bg-white"
      }`}
    >
      {/* Column Header */}
      <div
        className={`px-4 py-3 border-b border-gray-200 shrink-0 rounded-t-lg w-full ${
          bgColor ? bgColor : "bg-white"
        }`}
      >
        <div
          className={`flex items-center justify-start  rounded-sm gap-4 w-auto`}
        >
          <h3
            className={`text-xs font-semibold uppercase ${textColorHeader || "text-white"} ${bgColorHeader || "bg-white"} px-3 py-1 rounded-sm `}
          >
            {title}{" "}
          </h3>
          <span className={`font-normal ${textColorHeader}`}>
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-2 mt-2">
        {isLoading ? (
          // Show skeleton loaders while loading
          <>
            {[...Array(4)].map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </>
        ) : (
          <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-400">No tasks</p>
              </div>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard
                  key={task.id}
                  task={task}
                  teamMembers={teamMembers}
                  orgId={orgId}
                  onEdit={onEditTask}
                  onSend={onSendTask}
                  onDelete={onDeleteTask}
                  onUpdateStatus={onUpdateStatus}
                  onUpdateAssignee={onUpdateAssignee}
                  disabled={isUpdating}
                />
              ))
            )}
          </SortableContext>
        )}
      </div>

      {/* Add Task Button */}
      <div className="p-2 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddTask}
          className={`w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-gray-200`}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
