/**
 * AssigneeTab Component
 * Tab for assigning trial roles to activities
 */

"use client";

import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserRound, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { TRIAL_ROLES } from "@/lib/permissions/constants";
import type { ActivityType } from "@/services/activities/types";

interface AssigneeTabProps {
  activityIds: string[];
  activities: ActivityType[];
  assignees: Record<string, string>;
  onUpdateAssignees: (assignees: Record<string, string>) => void;
}

export function AssigneeTab({
  activityIds,
  activities,
  assignees,
  onUpdateAssignees,
}: AssigneeTabProps) {
  const handleAssigneeChange = (activityId: string, role: string) => {
    const newAssignees = {
      ...assignees,
      [activityId]: role,
    };
    onUpdateAssignees(newAssignees);
  };

  const handleRemoveAssignee = (activityId: string) => {
    const newAssignees = { ...assignees };
    delete newAssignees[activityId];
    onUpdateAssignees(newAssignees);
  };

  // Get activity details by ID
  const getActivityById = (id: string) => {
    return activities.find((a) => a.id === id);
  };

  if (activityIds.length === 0) {
    return (
      <div className="text-center py-12">
        <UserRound className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">
          No activities selected
        </p>
        <p className="text-sm text-gray-400">
          Add activities in the "Visit Schedule" tab to assign roles
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">
          Activity Role Assignment
        </h3>
        <p className="text-sm text-gray-500">
          Assign a trial role to each activity. Tasks will be auto-assigned
          to team members with that role.
        </p>
      </div>

      {/* Info Alert */}
      <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900">
          <p className="font-medium mb-1">How does it work?</p>
          <p className="text-blue-700">
            When a patient is created, tasks are automatically generated and
            assigned to the first trial team member with the selected role.
            If no user has that role, the task will remain unassigned.
          </p>
        </div>
      </div>

      {/* Activity Assignee List */}
      <div className="space-y-3">
        {activityIds.map((activityId) => {
          const activity = getActivityById(activityId);
          const assignedRole = assignees[activityId];

          return (
            <div
              key={activityId}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg bg-white"
            >
              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {activity?.name || activityId}
                  </span>
                  {activity?.category && (
                    <Badge className="bg-gray-100 text-gray-600 text-xs">
                      {activity.category}
                    </Badge>
                  )}
                </div>
                {activity?.description && (
                  <p className="text-sm text-gray-500 mt-0.5 truncate">
                    {activity.description}
                  </p>
                )}
              </div>

              {/* Role Selector */}
              <div className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-gray-400" />
                <select
                  value={assignedRole || ""}
                  onChange={(e) =>
                    e.target.value
                      ? handleAssigneeChange(activityId, e.target.value)
                      : handleRemoveAssignee(activityId)
                  }
                  className={cn(
                    "w-48 h-9 px-3 text-sm border border-gray-300 rounded-md bg-white",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    !assignedRole && "text-gray-500"
                  )}
                >
                  <option value="">Unassigned</option>
                  {TRIAL_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {activityIds.length} activit{activityIds.length !== 1 ? "ies" : "y"} in total
          </span>
          <span className="text-gray-600">
            {Object.keys(assignees).length} assigned
          </span>
        </div>
      </div>
    </div>
  );
}
