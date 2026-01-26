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
import { useTeamMembers } from "@/hooks/client/useTeamMembers";
import { usePatients } from "@/hooks/client/usePatients";
import { usePatientVisits } from "@/hooks/client/usePatientVisits";
import { TaskAssigneeSelect } from "./TaskAssigneeSelect";
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS, TASK_CATEGORY_OPTIONS } from "@/lib/constants/tasks";
import type { CreateTaskInput, TaskStatus, TaskPriority } from "@/services/tasks/types";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  isLoading: boolean;
  orgId: string;
  initialStatus?: TaskStatus;
  initialDescription?: string;
  initialTrialId?: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  orgId,
  initialStatus,
  initialDescription,
  initialTrialId,
}: CreateTaskModalProps) {
  const { trials } = useTrials(orgId);
  const { teamMembers } = useTeamMembers(orgId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [trialId, setTrialId] = useState("");
  const [status, setStatus] = useState<TaskStatus>(initialStatus || "todo");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assignedTo, setAssignedTo] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [patientId, setPatientId] = useState("__none__");
  const [visitId, setVisitId] = useState("__none__");
  const [category, setCategory] = useState("__none__");
  const [error, setError] = useState<string | null>(null);

  // Fetch patients for selected trial
  const { patients } = usePatients(orgId, trialId);

  // Fetch visits for selected patient (only if patient is selected)
  const { visits } = usePatientVisits(orgId, trialId, patientId);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription(initialDescription || "");
      setTrialId(initialTrialId || (trials.length === 1 ? trials[0].id : ""));
      setStatus(initialStatus || "todo");
      setPriority("medium");
      setAssignedTo(null);
      setDueDate("");
      setPatientId("__none__");
      setVisitId("__none__");
      setCategory("__none__");
      setError(null);
    }
  }, [isOpen, initialStatus, initialDescription, initialTrialId, trials]);

  // Waterfall: when trial changes → reset patient & visit
  useEffect(() => {
    setPatientId("__none__");
    setVisitId("__none__");
  }, [trialId]);

  // Waterfall: when patient changes → reset visit
  useEffect(() => {
    setVisitId("__none__");
  }, [patientId]);

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
        assigned_to: assignedTo || undefined,
        due_date: dueDate || undefined,
        patient_id: patientId !== "__none__" ? patientId : undefined,
        visit_id: visitId !== "__none__" ? visitId : undefined,
        category: category !== "__none__" ? category : undefined,
      });
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl">
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

          {/* Patient - Optional */}
          <div className="space-y-2">
            <Label htmlFor="patient">Patient (optional)</Label>
            <Select
              value={patientId}
              onValueChange={setPatientId}
              disabled={!trialId || isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No patient</SelectItem>
                {patients.map((patient) => (
                  <SelectItem key={patient.id} value={patient.id}>
                    {patient.patient_number}
                    {patient.initials && ` (${patient.initials})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visit - Optional, only if patient selected */}
          {patientId !== "__none__" && (
            <div className="space-y-2">
              <Label htmlFor="visit">Visit (optional)</Label>
              <Select
                value={visitId}
                onValueChange={setVisitId}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select visit (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No visit</SelectItem>
                  {visits.map((visit) => (
                    <SelectItem key={visit.id} value={visit.id}>
                      {visit.visit_name}
                      {visit.scheduled_date && ` - ${new Date(visit.scheduled_date).toLocaleDateString()}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category - Optional */}
          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Select
              value={category}
              onValueChange={setCategory}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No category</SelectItem>
                {TASK_CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
                  {TASK_STATUS_OPTIONS.map((option) => (
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
                  {TASK_PRIORITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>Assignee</Label>
            <TaskAssigneeSelect
              value={assignedTo}
              teamMembers={teamMembers}
              onChange={setAssignedTo}
              disabled={isLoading}
            />
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
