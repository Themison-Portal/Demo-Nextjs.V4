/**
 * Tasks View - Kanban Board
 * Main view for task management with kanban layout
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTasks } from "@/hooks/client/useTasks";
import { useTeamMembers } from "@/hooks/client/useTeamMembers";
import { useTasksByStatus } from "@/hooks/ui/useTasksByStatus";
import { TaskStatusColumn } from "./TaskStatusColumn";
import { TaskKanbanCard } from "./TaskKanbanCard";
import { TaskFiltersBar } from "./TaskFiltersBar";
import { CreateTaskModal } from "./CreateTaskModal";
import { EditTaskModal } from "./EditTaskModal";
import { SendTaskModal } from "@/components/app/messages/SendTaskModal";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Kanban } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import Link from "next/link";
import type {
  TaskStatus,
  TaskWithContext,
  TaskFilters,
} from "@/services/tasks/types";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  closestCorners,
  useSensor,
  useSensors,
  TouchSensor,
  KeyboardSensor,
  PointerSensor,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";

interface TasksViewProps {
  orgId: string;
}

export function TasksView({ orgId }: TasksViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filters, setFilters] = useState<TaskFilters>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskWithContext | null>(null);
  const [sendingTask, setSendingTask] = useState<TaskWithContext | null>(null);
  const [createModalStatus, setCreateModalStatus] = useState<TaskStatus | null>(
    null,
  );

  // Drag and drop state
  const [activeTask, setActiveTask] = useState<TaskWithContext | null>(null);
  const [localTasks, setLocalTasks] = useState<TaskWithContext[]>([]);
  const clonedTasksRef = useRef<TaskWithContext[] | null>(null);

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

  // Sync localTasks with tasks from server
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  // Group and sort tasks by status using custom hook (use localTasks for optimistic updates)
  const tasksByStatus = useTasksByStatus(localTasks);

  // Auto-open task from URL param (e.g., from message attachment)
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (taskId && allTasks.length > 0 && !editingTask) {
      const task = allTasks.find((t) => t.id === taskId);
      if (task) {
        setEditingTask(task);
        const newUrl = ROUTES.APP.TASKS(orgId);
        router.replace(newUrl);
      }
    }
  }, [searchParams, allTasks, editingTask, orgId, router]);

  const handleCreateTask = async (input: any) => {
    await createTask(input);
    setIsCreateModalOpen(false);
    setCreateModalStatus(null);
  };

  const handleUpdateTask = async (taskId: string, input: any) => {
    await updateTask(taskId, input);
    setEditingTask(null);
  };

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (confirm("Are you sure you want to delete this task?")) {
        await deleteTask(taskId);
      }
    },
    [deleteTask],
  );

  const handleUpdateAssignee = useCallback(
    async (taskId: string, userId: string | null) => {
      await updateTask(taskId, { assigned_to: userId });
    },
    [updateTask],
  );

  const handleUpdateStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await updateTask(taskId, { status });
    },
    [updateTask],
  );

  const handleAddTaskInColumn = (status: TaskStatus) => {
    setCreateModalStatus(status);
    setIsCreateModalOpen(true);
  };

  const handleEditTask = useCallback((task: TaskWithContext) => {
    setEditingTask(task);
  }, []);

  const handleSendTask = useCallback((task: TaskWithContext) => {
    setSendingTask(task);
  }, []);

  // Use refs to avoid recreating drag handlers on every render
  const tasksRef = useRef(tasks);
  const handleUpdateStatusRef = useRef(handleUpdateStatus);

  useEffect(() => {
    tasksRef.current = tasks;
    handleUpdateStatusRef.current = handleUpdateStatus;
  }, [tasks, handleUpdateStatus]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor),
  );

  // Handle drag start - snapshot state for cancel, track active task
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const task = active.data.current?.task as TaskWithContext;
      if (task) {
        clonedTasksRef.current = localTasks;
        setActiveTask(task);
      }
    },
    [localTasks],
  );

  // Handle drag over - optimistic cross-column move
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id;

    if (activeId === overId) return;

    // Determine the new status from where we're hovering
    let newStatus: TaskStatus;
    if (over.data.current?.type === "Task") {
      newStatus = over.data.current.task.status;
    } else {
      newStatus = over.id as TaskStatus;
    }

    // Only update state if the container actually changed
    setLocalTasks((prevTasks) => {
      const taskIndex = prevTasks.findIndex((t) => t.id === activeId);
      if (taskIndex === -1) return prevTasks;

      const currentTask = prevTasks[taskIndex];
      if (currentTask.status === newStatus) return prevTasks;

      const newTasks = [...prevTasks];
      newTasks[taskIndex] = { ...currentTask, status: newStatus };
      return newTasks;
    });
  }, []);

  // Handle drag end - sync with backend
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    clonedTasksRef.current = null;

    if (!over) {
      setLocalTasks(tasksRef.current);
      return;
    }

    const taskId = active.id as string;

    let newStatus: TaskStatus;
    if (over.data.current?.type === "Task") {
      newStatus = over.data.current.task.status;
    } else {
      newStatus = over.id as TaskStatus;
    }

    const currentTask = tasksRef.current.find((t) => t.id === taskId);
    if (currentTask && currentTask.status !== newStatus) {
      handleUpdateStatusRef.current(taskId, newStatus);
    } else {
      setLocalTasks(tasksRef.current);
    }
  }, []);

  // Handle drag cancel - restore snapshot
  const handleDragCancel = useCallback(() => {
    if (clonedTasksRef.current) {
      setLocalTasks(clonedTasksRef.current);
    }
    setActiveTask(null);
    clonedTasksRef.current = null;
  }, []);

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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
      >
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
              onSendTask={handleSendTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={handleUpdateStatus}
              onUpdateAssignee={handleUpdateAssignee}
              isUpdating={isUpdating}
              isLoading={isLoading}
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
              onSendTask={handleSendTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={handleUpdateStatus}
              onUpdateAssignee={handleUpdateAssignee}
              isUpdating={isUpdating}
              isLoading={isLoading}
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
              onSendTask={handleSendTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={handleUpdateStatus}
              onUpdateAssignee={handleUpdateAssignee}
              isUpdating={isUpdating}
              isLoading={isLoading}
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
              onSendTask={handleSendTask}
              onDeleteTask={handleDeleteTask}
              onUpdateStatus={handleUpdateStatus}
              onUpdateAssignee={handleUpdateAssignee}
              isUpdating={isUpdating}
              isLoading={isLoading}
              bgColor="bg-red-50"
              bgColorHeader="bg-red-600"
            />
          </div>
        </div>

        {/* DragOverlay - always mounted, children conditional */}
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay dropAnimation={null}>
              {activeTask ? (
                <div className="cursor-grabbing rotate-2 scale-[1.02] shadow-xl rounded-lg">
                  <TaskKanbanCard
                    task={activeTask}
                    teamMembers={teamMembers}
                    orgId={orgId}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onUpdateStatus={() => {}}
                    onUpdateAssignee={() => {}}
                    disabled={true}
                  />
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>

      {/* Modals */}
      {isCreateModalOpen && (
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
      )}

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

      {sendingTask && (
        <SendTaskModal
          task={sendingTask}
          orgId={orgId}
          isOpen={true}
          onClose={() => setSendingTask(null)}
          onSuccess={() => setSendingTask(null)}
        />
      )}
    </div>
  );
}
