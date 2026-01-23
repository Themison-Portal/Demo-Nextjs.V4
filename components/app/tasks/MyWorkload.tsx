/**
 * My Workload Component
 * Displays tasks assigned to current user across all trials
 */

'use client';

import { useState, useMemo } from "react";
import { useTasks } from "@/hooks/client/useTasks";
import { TaskCard } from "./TaskCard";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ClipboardList, ListTodo, Clock, CheckCircle2, XCircle, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/services/tasks/types";

interface MyWorkloadProps {
  orgId: string;
}

export function MyWorkload({ orgId }: MyWorkloadProps) {
  const { tasks, isLoading, error } = useTasks(orgId, { assigned_to: "me" });
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [trialFilter, setTrialFilter] = useState<string | 'all'>('all');
  const [activityFilter, setActivityFilter] = useState<string | 'all'>('all');

  // Extract unique trials
  const trials = useMemo(() => {
    const uniqueTrials = Array.from(
      new Map(tasks.map(t => [t.trial_id, { id: t.trial_id, name: t.trial.name }])).values()
    );
    return uniqueTrials;
  }, [tasks]);

  // Extract unique activity types
  const activityTypes = useMemo(() => {
    const uniqueActivities = Array.from(
      new Map(
        tasks
          .filter(t => t.activity_type)
          .map(t => [t.activity_type_id, { id: t.activity_type_id!, name: t.activity_type!.name }])
      ).values()
    );
    return uniqueActivities;
  }, [tasks]);

  // Apply filters
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Filter by trial
    if (trialFilter !== 'all') {
      result = result.filter(task => task.trial_id === trialFilter);
    }

    // Filter by activity type
    if (activityFilter !== 'all') {
      result = result.filter(task => task.activity_type_id === activityFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter(task => task.status === statusFilter);
    }

    return result;
  }, [tasks, trialFilter, activityFilter, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-5 w-5" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-600">Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  const statusCounts = {
    all: filteredTasks.length,
    todo: filteredTasks.filter(t => t.status === 'todo').length,
    in_progress: filteredTasks.filter(t => t.status === 'in_progress').length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    blocked: filteredTasks.filter(t => t.status === 'blocked').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">My Tasks</h2>

        {/* Two-section filter layout */}
        <div className="flex items-center gap-4">
          {/* Left section: Trial & Activity filters */}
          <div className="flex items-center gap-1">
            {/* Trial Filter Dropdown */}
            {trials.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {trials.find(t => t.id === trialFilter)?.name || 'All Trials'}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1" align="start">
                  <button
                    onClick={() => setTrialFilter('all')}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                      trialFilter === 'all' && "bg-gray-50"
                    )}
                  >
                    <span>All Trials</span>
                    {trialFilter === 'all' && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                  {trials.map(trial => (
                    <button
                      key={trial.id}
                      onClick={() => setTrialFilter(trial.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                        trialFilter === trial.id && "bg-gray-50"
                      )}
                    >
                      <span>{trial.name}</span>
                      {trialFilter === trial.id && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}

            {/* Activity Type Filter Dropdown */}
            {activityTypes.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    {activityTypes.find(a => a.id === activityFilter)?.name || 'All Activities'}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1" align="start">
                  <button
                    onClick={() => setActivityFilter('all')}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                      activityFilter === 'all' && "bg-gray-50"
                    )}
                  >
                    <span>All Activities</span>
                    {activityFilter === 'all' && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                  {activityTypes.map(activity => (
                    <button
                      key={activity.id}
                      onClick={() => setActivityFilter(activity.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                        activityFilter === activity.id && "bg-gray-50"
                      )}
                    >
                      <span>{activity.name}</span>
                      {activityFilter === activity.id && <Check className="h-4 w-4 text-blue-600" />}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Right section: Status filters */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-gray-100' : ''}
            >
              <ListTodo className="h-4 w-4" />
              All ({statusCounts.all})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('todo')}
              className={statusFilter === 'todo' ? 'bg-gray-100' : ''}
            >
              <Clock className="h-4 w-4" />
              To Do ({statusCounts.todo})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('in_progress')}
              className={statusFilter === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
            >
              <Clock className="h-4 w-4" />
              In Progress ({statusCounts.in_progress})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('completed')}
              className={statusFilter === 'completed' ? 'bg-green-100 text-green-700' : ''}
            >
              <CheckCircle2 className="h-4 w-4" />
              Done ({statusCounts.completed})
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusFilter('blocked')}
              className={statusFilter === 'blocked' ? 'bg-red-100 text-red-700' : ''}
            >
              <XCircle className="h-4 w-4" />
              Blocked ({statusCounts.blocked})
            </Button>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
          <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {statusFilter === 'all' && trialFilter === 'all'
              ? "No tasks assigned"
              : "No tasks match the selected filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
