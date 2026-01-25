/**
 * Task Status Column
 * A single column in the kanban board
 */

"use client";

import { useCallback } from "react";
import { TaskKanbanCard } from "./TaskKanbanCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { TaskStatus, TaskWithContext } from "@/services/tasks/types";
import type { TeamMember } from "@/services/client/teamMembers";

interface TaskStatusColumnProps {
  status: TaskStatus;
  title: string;
  tasks: TaskWithContext[];
  teamMembers: TeamMember[];
  orgId: string;
  onAddTask: () => void;
  onEditTask: (task: TaskWithContext) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateAssignee: (taskId: string, userId: string | null) => void;
  isUpdating: boolean;
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
  onDeleteTask,
  onUpdateStatus,
  onUpdateAssignee,
  isUpdating,
  bgColor,
  bgColorHeader,
  textColorHeader,
}: TaskStatusColumnProps) {
  return (
    <div
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
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-gray-400">No tasks</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskKanbanCard
              key={task.id}
              task={task}
              teamMembers={teamMembers}
              orgId={orgId}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onUpdateStatus={onUpdateStatus}
              onUpdateAssignee={onUpdateAssignee}
              disabled={isUpdating}
            />
          ))
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
