/**
 * My Workload Component
 * Displays tasks assigned to current user across all trials
 */

"use client";

import { useTasks } from "@/hooks/client/useTasks";
import { useTaskFilters } from "@/hooks/ui/useTaskFilters";
import { useTaskGroups } from "@/hooks/ui/useTaskGroups";
import { TaskCard } from "./TaskCard";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ClipboardList,
  ListTodo,
  Clock,
  XCircle,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MyWorkloadProps {
  orgId: string;
}

export function MyWorkload({ orgId }: MyWorkloadProps) {
  const { tasks, isLoading, error } = useTasks(orgId, { assigned_to: "me" });

  // Use custom hooks for filtering and grouping logic
  const {
    statusFilter,
    trialFilter,
    activityFilter,
    patientFilter,
    dateFilter,
    setStatusFilter,
    setTrialFilter,
    setActivityFilter,
    setPatientFilter,
    setDateFilter,
    filteredTasks,
    statusCounts,
    filterOptions,
  } = useTaskFilters({
    tasks,
    excludeCompleted: true,
    initialStatusFilter: "all",
    initialDateFilter: "today",
  });

  const { groups: groupedTasks, expandedGroups, toggleGroup } = useTaskGroups(
    filteredTasks,
    dateFilter === "all"
  );

  // Destructure filter options from hook
  const { trials, activityTypes, patients } = filterOptions;

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
        <p className="text-sm text-red-600">
          Failed to load tasks. Please try again.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="space-y-2">
        {/* Line 1: All filters in one line */}
        <div className="flex items-center gap-1">
          {/* My Tasks - styled as filter */}
          <Button
            variant="outline"
            size="sm"
            className="font-semibold pointer-events-none bg-gray-900 text-white"
          >
            My Tasks
          </Button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />
          {/* Trial Filter Dropdown */}
          {trials.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {trials.find((t) => t.id === trialFilter)?.name ||
                    "All Trials"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" align="start">
                <button
                  onClick={() => setTrialFilter("all")}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                    trialFilter === "all" && "bg-gray-50",
                  )}
                >
                  <span>All Trials</span>
                  {trialFilter === "all" && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
                {trials.map((trial) => (
                  <button
                    key={trial.id}
                    onClick={() => setTrialFilter(trial.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                      trialFilter === trial.id && "bg-gray-50",
                    )}
                  >
                    <span>{trial.name}</span>
                    {trialFilter === trial.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
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
                  {activityTypes.find((a) => a.id === activityFilter)?.name ||
                    "All Activities"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" align="start">
                <button
                  onClick={() => setActivityFilter("all")}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                    activityFilter === "all" && "bg-gray-50",
                  )}
                >
                  <span>All Activities</span>
                  {activityFilter === "all" && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
                {activityTypes.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => setActivityFilter(activity.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                      activityFilter === activity.id && "bg-gray-50",
                    )}
                  >
                    <span>{activity.name}</span>
                    {activityFilter === activity.id && (
                      <Check className="h-4 w-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          )}

          {/* Patient Filter Dropdown */}
          {patients.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  {patients.find((p) => p.id === patientFilter)
                    ? `${patients.find((p) => p.id === patientFilter)!.patient_number}${
                        patients.find((p) => p.id === patientFilter)!.initials
                          ? ` (${patients.find((p) => p.id === patientFilter)!.initials})`
                          : ""
                      }`
                    : "All Patients"}
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-1" align="start">
                <button
                  onClick={() => setPatientFilter("all")}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                    patientFilter === "all" && "bg-gray-50",
                  )}
                >
                  <span>All Patients</span>
                  {patientFilter === "all" && (
                    <Check className="h-4 w-4 text-blue-600" />
                  )}
                </button>
                <div className="max-h-64 overflow-y-auto">
                  {patients.map((patient) => {
                    const displayName = `${patient.patient_number}${
                      patient.initials ? ` (${patient.initials})` : ""
                    }`;
                    return (
                      <button
                        key={patient.id}
                        onClick={() => setPatientFilter(patient.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                          patientFilter === patient.id && "bg-gray-50",
                        )}
                      >
                        <span>{displayName}</span>
                        {patientFilter === patient.id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />

          {/* Status Filter Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                {statusFilter === "all" && (
                  <>
                    <ListTodo className="h-4 w-4 mr-1" />
                    All Statuses ({statusCounts.all})
                  </>
                )}
                {statusFilter === "todo" && (
                  <>
                    <Clock className="h-4 w-4 mr-1" />
                    To Do ({statusCounts.todo})
                  </>
                )}
                {statusFilter === "in_progress" && (
                  <>
                    <Clock className="h-4 w-4 mr-1 text-blue-700" />
                    <span className="text-blue-700">
                      In Progress ({statusCounts.in_progress})
                    </span>
                  </>
                )}
                {statusFilter === "blocked" && (
                  <>
                    <XCircle className="h-4 w-4 mr-1 text-red-700" />
                    <span className="text-red-700">
                      Blocked ({statusCounts.blocked})
                    </span>
                  </>
                )}
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1" align="start">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                  statusFilter === "all" && "bg-gray-50",
                )}
              >
                <ListTodo className="h-4 w-4 text-gray-700" />
                <span className="flex-1 text-left">
                  All Statuses ({statusCounts.all})
                </span>
                {statusFilter === "all" && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>

              <button
                onClick={() => setStatusFilter("todo")}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                  statusFilter === "todo" && "bg-gray-50",
                )}
              >
                <Clock className="h-4 w-4 text-gray-700" />
                <span className="flex-1 text-left">
                  To Do ({statusCounts.todo})
                </span>
                {statusFilter === "todo" && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>

              <button
                onClick={() => setStatusFilter("in_progress")}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                  statusFilter === "in_progress" && "bg-gray-50",
                )}
              >
                <Clock className="h-4 w-4 text-blue-700" />
                <span className="flex-1 text-left text-blue-700">
                  In Progress ({statusCounts.in_progress})
                </span>
                {statusFilter === "in_progress" && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>

              <button
                onClick={() => setStatusFilter("blocked")}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm rounded transition-colors hover:bg-gray-100",
                  statusFilter === "blocked" && "bg-gray-50",
                )}
              >
                <XCircle className="h-4 w-4 text-red-700" />
                <span className="flex-1 text-left text-red-700">
                  Blocked ({statusCounts.blocked})
                </span>
                {statusFilter === "blocked" && (
                  <Check className="h-4 w-4 text-blue-600" />
                )}
              </button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Line 2: Date filters (left-aligned) */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateFilter("overdue")}
            className={cn(
              "text-red-700",
              dateFilter === "overdue" ? "bg-red-100" : "bg-white",
            )}
          >
            Overdue
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateFilter("today")}
            className={dateFilter === "today" ? "bg-gray-100" : ""}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateFilter("tomorrow")}
            className={dateFilter === "tomorrow" ? "bg-gray-100" : ""}
          >
            Tomorrow
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDateFilter("all")}
            className={dateFilter === "all" ? "bg-gray-100" : ""}
          >
            All Time
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
          <ClipboardList className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            {statusFilter === "all" && trialFilter === "all"
              ? "No tasks assigned"
              : "No tasks match the selected filters"}
          </p>
        </div>
      ) : groupedTasks ? (
        // Grouped view for "All Time" with collapsible sections
        <div className="space-y-4">
          {groupedTasks.overdue.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup("overdue")}
                className="flex items-center gap-2 w-full text-left mb-2 px-1 hover:opacity-70 transition-opacity"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-red-700 transition-transform",
                    !expandedGroups.overdue && "-rotate-90",
                  )}
                />
                <h3 className="text-xs font-semibold text-red-700 uppercase tracking-wide">
                  Overdue ({groupedTasks.overdue.length})
                </h3>
              </button>
              {expandedGroups.overdue && (
                <div className="space-y-1">
                  {groupedTasks.overdue.map((task) => (
                    <TaskCard key={task.id} task={task} orgId={orgId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {groupedTasks.today.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup("today")}
                className="flex items-center gap-2 w-full text-left mb-2 px-1 hover:opacity-70 transition-opacity"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-700 transition-transform",
                    !expandedGroups.today && "-rotate-90",
                  )}
                />
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Today ({groupedTasks.today.length})
                </h3>
              </button>
              {expandedGroups.today && (
                <div className="space-y-1">
                  {groupedTasks.today.map((task) => (
                    <TaskCard key={task.id} task={task} orgId={orgId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {groupedTasks.tomorrow.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup("tomorrow")}
                className="flex items-center gap-2 w-full text-left mb-2 px-1 hover:opacity-70 transition-opacity"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-700 transition-transform",
                    !expandedGroups.tomorrow && "-rotate-90",
                  )}
                />
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Tomorrow ({groupedTasks.tomorrow.length})
                </h3>
              </button>
              {expandedGroups.tomorrow && (
                <div className="space-y-1">
                  {groupedTasks.tomorrow.map((task) => (
                    <TaskCard key={task.id} task={task} orgId={orgId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {groupedTasks.thisWeek.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup("thisWeek")}
                className="flex items-center gap-2 w-full text-left mb-2 px-1 hover:opacity-70 transition-opacity"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-700 transition-transform",
                    !expandedGroups.thisWeek && "-rotate-90",
                  )}
                />
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  This Week ({groupedTasks.thisWeek.length})
                </h3>
              </button>
              {expandedGroups.thisWeek && (
                <div className="space-y-1">
                  {groupedTasks.thisWeek.map((task) => (
                    <TaskCard key={task.id} task={task} orgId={orgId} />
                  ))}
                </div>
              )}
            </div>
          )}

          {groupedTasks.upcoming.length > 0 && (
            <div>
              <button
                onClick={() => toggleGroup("upcoming")}
                className="flex items-center gap-2 w-full text-left mb-2 px-1 hover:opacity-70 transition-opacity"
              >
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-700 transition-transform",
                    !expandedGroups.upcoming && "-rotate-90",
                  )}
                />
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Upcoming ({groupedTasks.upcoming.length})
                </h3>
              </button>
              {expandedGroups.upcoming && (
                <div className="space-y-1">
                  {groupedTasks.upcoming.map((task) => (
                    <TaskCard key={task.id} task={task} orgId={orgId} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Simple list for filtered views
        <div className="space-y-1">
          {filteredTasks.map((task) => (
            <TaskCard key={task.id} task={task} orgId={orgId} />
          ))}
        </div>
      )}
    </div>
  );
}
