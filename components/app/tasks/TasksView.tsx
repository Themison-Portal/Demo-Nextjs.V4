/**
 * Tasks View - Kanban Board
 * Main view for task management with kanban layout
 */

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/client/useTasks";
import { TaskStatusColumn } from "./TaskStatusColumn";
import { TaskFiltersBar } from "./TaskFiltersBar";
import { CreateTaskModal } from "./CreateTaskModal";
import { EditTaskModal } from "./EditTaskModal";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import type {
  TaskStatus,
  TaskWithContext,
  TaskFilters,
} from "@/services/tasks/types";

interface TasksViewProps {
  orgId: string;
}

export function TasksView({ orgId }: TasksViewProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithContext | null>(null);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus | null>(
    null
  );

  const {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTasks(orgId, filters);

  // Group tasks by status
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, TaskWithContext[]> = {
      todo: [],
      in_progress: [],
      completed: [],
      blocked: [],
    };

    tasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [tasks]);

  const handleCreateTask = async (input: any) => {
    await createTask(input);
    setIsCreateModalOpen(false);
    setCreateModalStatus(null);
  };

  const handleUpdateTask = async (taskId: string, input: any) => {
    await updateTask(taskId, input);
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(taskId);
    }
  };

  const handleAddTaskInColumn = (status: TaskStatus) => {
    setCreateModalStatus(status);
    setIsCreateModalOpen(true);
  };

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
    <div className="h-full flex flex-col">
      {/* Header with navigation */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${orgId}/dashboard`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="h-4 w-px bg-gray-300" />
          <h1 className="text-lg font-semibold text-gray-900">Kanban Board</h1>
          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-auto"
          >
            <Plus className="h-4 w-4 mr-1" />
            New Task
          </Button>
        </div>

        {/* Filters */}
        <TaskFiltersBar
          orgId={orgId}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto bg-gray-50">
        <div className="h-full min-w-max px- py-4">
          <div className="grid grid-cols-4 gap-4 h-full">
            <TaskStatusColumn
              status="todo"
              title="To Do"
              tasks={tasksByStatus.todo}
              onAddTask={() => handleAddTaskInColumn("todo")}
              onEditTask={setEditingTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={(taskId, status) =>
                updateTask(taskId, { status })
              }
              isUpdating={isUpdating}
              bgColor="bg-gray-100"
            />
            <TaskStatusColumn
              status="in_progress"
              title="In Progress"
              tasks={tasksByStatus.in_progress}
              onAddTask={() => handleAddTaskInColumn("in_progress")}
              onEditTask={setEditingTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={(taskId, status) =>
                updateTask(taskId, { status })
              }
              isUpdating={isUpdating}
              bgColor="bg-blue-50"
            />
            <TaskStatusColumn
              status="completed"
              title="Done"
              tasks={tasksByStatus.completed}
              onAddTask={() => handleAddTaskInColumn("completed")}
              onEditTask={setEditingTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={(taskId, status) =>
                updateTask(taskId, { status })
              }
              isUpdating={isUpdating}
              bgColor="bg-green-50"
            />
            <TaskStatusColumn
              status="blocked"
              title="Blocked"
              tasks={tasksByStatus.blocked}
              onAddTask={() => handleAddTaskInColumn("blocked")}
              onEditTask={setEditingTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={(taskId, status) =>
                updateTask(taskId, { status })
              }
              isUpdating={isUpdating}
              bgColor="bg-red-50"
            />
          </div>
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
        />
      )}
    </div>
  );
}
