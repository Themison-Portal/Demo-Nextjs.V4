/**
 * Edit Task Modal
 * Modal for editing an existing task
 */

"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TaskWithContext, UpdateTaskInput, TaskStatus, TaskPriority } from "@/services/tasks/types";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: UpdateTaskInput) => Promise<void>;
  onDelete: () => void;
  isLoading: boolean;
  isDeleting: boolean;
  task: TaskWithContext;
  orgId: string;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Done" },
  { value: "blocked", label: "Blocked" },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function EditTaskModal({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  isLoading,
  isDeleting,
  task,
}: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority || "medium");
  const [dueDate, setDueDate] = useState(task.due_date?.split("T")[0] || "");
  const [error, setError] = useState<string | null>(null);

  // Reset form when task changes
  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority || "medium");
      setDueDate(task.due_date?.split("T")[0] || "");
      setError(null);
    }
  }, [isOpen, task]);

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        due_date: dueDate || undefined,
      });
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader>Edit Task</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
              disabled={isLoading}
            />
          </div>

          {/* Trial (read-only) */}
          <div className="space-y-2">
            <Label>Trial</Label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
              {task.trial?.name || "Unknown Trial"}
            </div>
          </div>

          {/* Patient (if exists, read-only) */}
          {task.patient && (
            <div className="space-y-2">
              <Label>Patient</Label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700">
                {task.patient.patient_number}
                {task.patient.initials && ` (${task.patient.initials})`}
              </div>
            </div>
          )}

          {/* Status and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={status}
                onValueChange={(value) => setStatus(value as TaskStatus)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as TaskPriority)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="border border-red-300 rounded p-3 bg-red-50">
              <p className="text-sm text-red-900">{error}</p>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="ghost"
          onClick={onDelete}
          disabled={isLoading || isDeleting}
          className="mr-auto text-red-600 hover:text-red-700"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
