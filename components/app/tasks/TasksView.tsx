/**
 * Tasks View - Kanban Board
 * Main view for task management with kanban layout
 */

"use client";

import { useState, useCallback } from "react";
import { useTasks } from "@/hooks/client/useTasks";
import { useTeamMembers } from "@/hooks/client/useTeamMembers";
import { useTasksByStatus } from "@/hooks/ui/useTasksByStatus";
import { TaskStatusColumn } from "./TaskStatusColumn";
import { TaskFiltersBar } from "./TaskFiltersBar";
import { CreateTaskModal } from "./CreateTaskModal";
import { EditTaskModal } from "./EditTaskModal";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Kanban } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type {
  TaskStatus,
  TaskWithContext,
  TaskFilters,
} from "@/services/tasks/types";

interface TasksViewProps {
  orgId: string;
}

export function TasksView({ orgId }: TasksViewProps) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithContext | null>(null);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus | null>(
    null,
  );

  const {
    tasks,
    allTasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTasks(orgId, filters);

  const { teamMembers } = useTeamMembers(orgId);

  // Group and sort tasks by status using custom hook
  const tasksByStatus = useTasksByStatus(tasks);

  const handleCreateTask = async (input: any) => {
    await createTask(input);
    setIsCreateModalOpen(false);
    setCreateModalStatus(null);
  };

  const handleUpdateTask = async (taskId: string, input: any) => {
    await updateTask(taskId, input);
    setEditingTask(null);
  };

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  }, [deleteTask]);

  const handleUpdateAssignee = useCallback(async (
    taskId: string,
    userId: string | null,
  ) => {
    await updateTask(taskId, { assigned_to: userId });
  }, [updateTask]);

  const handleUpdateStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    await updateTask(taskId, { status });
  }, [updateTask]);

  const handleAddTaskInColumn = (status: TaskStatus) => {
    setCreateModalStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleEditTask = useCallback((task: TaskWithContext) => {
    setEditingTask(task);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-red-600">
          Failed to load tasks. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full ">
      {/* Navigation Bar */}
      <div className="bg-white rounded-lg border border-gray-200 px-2 py-1.5 mb-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Left: Back + Kanban Board */}
          <div className="flex items-center gap-1">
            <Link
              href={ROUTES.APP.DASHBOARD(orgId)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="w-px h-5 bg-gray-200 mx-1" />
            <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-700 bg-gray-100 rounded-md">
              <Kanban className="h-4 w-4" />
              <span>Kanban Board</span>
            </div>
          </div>

          {/* Right: Add Task Button */}
          <Button size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex-shrink-0">
        <TaskFiltersBar
          orgId={orgId}
          filters={filters}
          onFiltersChange={setFilters}
          tasks={allTasks}
        />
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-scroll overflow-y-hidden py-4  w-full  flex-1 ">
        <div className="flex gap-4 items-start h-full w-full flex-1 ">
          <TaskStatusColumn
            status="todo"
            title="To Do"
            tasks={tasksByStatus.todo}
            teamMembers={teamMembers}
            orgId={orgId}
            onAddTask={() => handleAddTaskInColumn("todo")}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
            onUpdateAssignee={handleUpdateAssignee}
            isUpdating={isUpdating}
            bgColor="bg-gray-100"
            bgColorHeader="bg-gray-200"
            textColorHeader="text-gray-900"
          />
          <TaskStatusColumn
            status="in_progress"
            title="In Progress"
            tasks={tasksByStatus.in_progress}
            teamMembers={teamMembers}
            orgId={orgId}
            onAddTask={() => handleAddTaskInColumn("in_progress")}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
            onUpdateAssignee={handleUpdateAssignee}
            isUpdating={isUpdating}
            bgColor="bg-blue-50"
            bgColorHeader="bg-blue-500"
          />
          <TaskStatusColumn
            status="completed"
            title="Done"
            tasks={tasksByStatus.completed}
            teamMembers={teamMembers}
            orgId={orgId}
            onAddTask={() => handleAddTaskInColumn("completed")}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
            onUpdateAssignee={handleUpdateAssignee}
            isUpdating={isUpdating}
            bgColor="bg-green-50"
            bgColorHeader="bg-green-600"
          />
          <TaskStatusColumn
            status="blocked"
            title="Blocked"
            tasks={tasksByStatus.blocked}
            teamMembers={teamMembers}
            orgId={orgId}
            onAddTask={() => handleAddTaskInColumn("blocked")}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onUpdateStatus={handleUpdateStatus}
            onUpdateAssignee={handleUpdateAssignee}
            isUpdating={isUpdating}
            bgColor="bg-red-50"
            bgColorHeader="bg-red-600"
          />
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateModalStatus(null);
        }}
        onSubmit={handleCreateTask}
        isLoading={isCreating}
        orgId={orgId}
        initialStatus={createModalStatus || undefined}
      />

      {editingTask && (
        <EditTaskModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSubmit={(input) => handleUpdateTask(editingTask.id, input)}
          onDelete={() => handleDeleteTask(editingTask.id)}
          isLoading={isUpdating}
          isDeleting={isDeleting}
          task={editingTask}
          orgId={orgId}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}
