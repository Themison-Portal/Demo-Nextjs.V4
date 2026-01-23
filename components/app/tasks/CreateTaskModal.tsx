/**
 * Create Task Modal
 * Modal for creating a new task
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
import { useTrials } from "@/hooks/client/useTrials";
import type { CreateTaskInput, TaskStatus, TaskPriority } from "@/services/tasks/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  isLoading: boolean;
  orgId: string;
  initialStatus?: TaskStatus;
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

export function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  orgId,
  initialStatus,
}: CreateTaskModalProps) {
  const { trials } = useTrials(orgId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trialId, setTrialId] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus || "todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setTrialId(trials.length === 1 ? trials[0].id : "");
      setStatus(initialStatus || "todo");
      setPriority("medium");
      setDueDate("");
      setError(null);
    }
  }, [isOpen, initialStatus, trials]);

  const handleSubmit = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (!trialId) {
      setError("Trial is required");
      return;
    }

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        trial_id: trialId,
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
      <ModalHeader>Create New Task</ModalHeader>
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

          {/* Trial */}
          <div className="space-y-2">
            <Label htmlFor="trial">
              Trial <span className="text-red-500">*</span>
            </Label>
            <Select value={trialId} onValueChange={setTrialId} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Select trial" />
              </SelectTrigger>
              <SelectContent>
                {trials.map((trial) => (
                  <SelectItem key={trial.id} value={trial.id}>
                    {trial.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Task"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
