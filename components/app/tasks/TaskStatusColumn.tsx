/**
 * Task Status Column
 * A single column in the kanban board
 */

"use client";

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
  onAddTask: () => void;
  onEditTask: (task: TaskWithContext) => void;
  onDeleteTask: (taskId: string) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateAssignee: (taskId: string, userId: string | null) => void;
  isUpdating: boolean;
  bgColor?: string;
}

export function TaskStatusColumn({
  status,
  title,
  tasks,
  teamMembers,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
  onUpdateAssignee,
  isUpdating,
  bgColor,
}: TaskStatusColumnProps) {
  return (
    <div
      className={`flex flex-col h-full rounded-lg border border-gray-200 ${
        bgColor ? bgColor : "bg-white"
      }`}
    >
      {/* Column Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {title}{" "}
            <span className="text-gray-500 font-normal">({tasks.length})</span>
          </h3>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
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
              onEdit={() => onEditTask(task)}
              onDelete={() => onDeleteTask(task.id)}
              onUpdateStatus={(newStatus) => onUpdateStatus(task.id, newStatus)}
              onUpdateAssignee={(userId) => onUpdateAssignee(task.id, userId)}
              disabled={isUpdating}
            />
          ))
        )}
      </div>

      {/* Add Task Button */}
      <div className="p-3 border-t border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddTask}
          className="w-full justify-start text-gray-600 hover:text-gray-900"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Task
        </Button>
      </div>
    </div>
  );
}
