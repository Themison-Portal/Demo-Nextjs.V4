/**
 * Task Filters Bar
 * Filter controls for tasks: Trial, Assignee, Priority, Patient
 */

'use client';

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrials } from "@/hooks/client/useTrials";
import { useTeamMembers } from "@/hooks/client/useTeamMembers";
import type { TaskFilters, TaskPriority, TaskWithContext } from "@/services/tasks/types";

interface TaskFiltersBarProps {
  orgId: string;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
  tasks: TaskWithContext[]; // Needed for patient filter (option A - simple)
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function TaskFiltersBar({
  orgId,
  filters,
  onFiltersChange,
  tasks,
}: TaskFiltersBarProps) {
  const { trials } = useTrials(orgId);
  const { teamMembers } = useTeamMembers(orgId);

  // Extract unique patients from current tasks (Option A - simple)
  // NOTE: For Option B (show all patients from trials), we would need a
  // dedicated /api/client/[orgId]/patients endpoint that returns patients
  // from all trials the user has access to, similar to how team-members works.
  const patients = useMemo(() => {
    const uniquePatients = new Map();
    tasks.forEach((task) => {
      if (task.patient && task.patient_id) {
        uniquePatients.set(task.patient_id, {
          id: task.patient_id,
          patient_number: task.patient.patient_number,
          initials: task.patient.initials,
        });
      }
    });
    return Array.from(uniquePatients.values());
  }, [tasks]);

  // Extract unique categories from current tasks
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    tasks.forEach((task) => {
      if (task.activity_type?.category) {
        uniqueCategories.add(task.activity_type.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [tasks]);

  const updateFilter = (key: keyof TaskFilters, value: string | undefined) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined);

  // Find selected assignee name
  const selectedAssignee = filters.assigned_to
    ? teamMembers.find((m) => m.user_id === filters.assigned_to)
    : null;

  // Find selected patient name
  const selectedPatient = filters.patient_id
    ? patients.find((p) => p.id === filters.patient_id)
    : null;

  return (
    <div className="flex items-center gap-2">
      {/* Trial Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {filters.trial_id
              ? trials.find((t) => t.id === filters.trial_id)?.name || "Trial"
              : "All Trials"}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align="start">
          <button
            onClick={() => updateFilter("trial_id", undefined)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
              !filters.trial_id && "bg-gray-50"
            )}
          >
            <span>All Trials</span>
            {!filters.trial_id && <Check className="h-4 w-4 text-blue-600" />}
          </button>
          {trials.map((trial) => (
            <button
              key={trial.id}
              onClick={() => updateFilter("trial_id", trial.id)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                filters.trial_id === trial.id && "bg-gray-50"
              )}
            >
              <span>{trial.name}</span>
              {filters.trial_id === trial.id && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Assignee Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {selectedAssignee
              ? selectedAssignee.full_name || selectedAssignee.email
              : "All Assignees"}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-1" align="start">
          <button
            onClick={() => updateFilter("assigned_to", undefined)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
              !filters.assigned_to && "bg-gray-50"
            )}
          >
            <span>All Assignees</span>
            {!filters.assigned_to && <Check className="h-4 w-4 text-blue-600" />}
          </button>
          <div className="max-h-64 overflow-y-auto">
            {teamMembers.map((member) => {
              const isSelected = filters.assigned_to === member.user_id;
              const displayName = member.full_name || member.email;

              return (
                <button
                  key={member.user_id}
                  onClick={() => updateFilter("assigned_to", member.user_id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors hover:bg-gray-100",
                    isSelected && "bg-gray-50"
                  )}
                >
                  {/* Avatar */}
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                    {displayName?.charAt(0).toUpperCase() || "?"}
                  </div>

                  {/* Name and role */}
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium text-gray-900">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {member.trial_role}
                      {member.trials.length > 1 &&
                        ` (+${member.trials.length - 1} trials)`}
                    </p>
                  </div>

                  {/* Check icon */}
                  {isSelected && (
                    <Check className="h-3 w-3 text-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* Patient Filter */}
      {patients.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {selectedPatient
                ? `${selectedPatient.patient_number}${
                    selectedPatient.initials ? ` (${selectedPatient.initials})` : ""
                  }`
                : "All Patients"}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" align="start">
            <button
              onClick={() => updateFilter("patient_id", undefined)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                !filters.patient_id && "bg-gray-50"
              )}
            >
              <span>All Patients</span>
              {!filters.patient_id && <Check className="h-4 w-4 text-blue-600" />}
            </button>
            <div className="max-h-64 overflow-y-auto">
              {patients.map((patient) => {
                const isSelected = filters.patient_id === patient.id;
                const displayName = `${patient.patient_number}${
                  patient.initials ? ` (${patient.initials})` : ""
                }`;

                return (
                  <button
                    key={patient.id}
                    onClick={() => updateFilter("patient_id", patient.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                      isSelected && "bg-gray-50"
                    )}
                  >
                    <span>{displayName}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Priority Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {filters.priority
              ? PRIORITIES.find((p) => p.value === filters.priority)?.label ||
                "Priority"
              : "All Priorities"}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align="start">
          <button
            onClick={() => updateFilter("priority", undefined)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
              !filters.priority && "bg-gray-50"
            )}
          >
            <span>All Priorities</span>
            {!filters.priority && <Check className="h-4 w-4 text-blue-600" />}
          </button>
          {PRIORITIES.map((priority) => (
            <button
              key={priority.value}
              onClick={() => updateFilter("priority", priority.value)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                filters.priority === priority.value && "bg-gray-50"
              )}
            >
              <span>{priority.label}</span>
              {filters.priority === priority.value && (
                <Check className="h-4 w-4 text-blue-600" />
              )}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Category Filter */}
      {categories.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              {filters.category || "All Categories"}
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" align="start">
            <button
              onClick={() => updateFilter("category", undefined)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                !filters.category && "bg-gray-50"
              )}
            >
              <span>All Categories</span>
              {!filters.category && <Check className="h-4 w-4 text-blue-600" />}
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => updateFilter("category", category)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                  filters.category === category && "bg-gray-50"
                )}
              >
                <span>{category}</span>
                {filters.category === category && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-gray-600"
        >
          <X className="h-4 w-4 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
