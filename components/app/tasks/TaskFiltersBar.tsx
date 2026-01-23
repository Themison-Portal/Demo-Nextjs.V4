/**
 * Task Filters Bar
 * Filter controls for tasks: Trial, Assignee, Priority, Patient
 */

'use client';

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrials } from "@/hooks/client/useTrials";
import type { TaskFilters, TaskPriority } from "@/services/tasks/types";

interface TaskFiltersBarProps {
  orgId: string;
  filters: TaskFilters;
  onFiltersChange: (filters: TaskFilters) => void;
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
}: TaskFiltersBarProps) {
  const { trials } = useTrials(orgId);

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
