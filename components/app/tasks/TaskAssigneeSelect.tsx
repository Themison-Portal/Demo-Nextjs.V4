/**
 * Task Assignee Select
 * Select component for assigning tasks to team members
 * Supports suggested role matching for activity-based tasks
 */

"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Check, User } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TeamMember } from "@/services/client/teamMembers";

interface TaskAssigneeSelectProps {
  value?: string | null; // user_id
  suggestedRole?: string | null; // Role from activity type
  teamMembers: TeamMember[];
  onChange: (userId: string | null) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function TaskAssigneeSelect({
  value,
  suggestedRole,
  teamMembers,
  onChange,
  disabled = false,
  size = "md",
}: TaskAssigneeSelectProps) {
  const [open, setOpen] = useState(false);

  // Memoize expensive filtering operations
  const suggested = useMemo(() => {
    if (!suggestedRole) return [];
    return teamMembers.filter((m) =>
      m.trials.some((t) => t.trial_role === suggestedRole)
    );
  }, [teamMembers, suggestedRole]);

  const others = useMemo(() => {
    if (!suggestedRole) return teamMembers;
    return teamMembers.filter(
      (m) => !m.trials.some((t) => t.trial_role === suggestedRole)
    );
  }, [teamMembers, suggestedRole]);

  // Find selected member
  const selectedMember = useMemo(() => {
    return value ? teamMembers?.find((m) => m.user_id === value) : null;
  }, [value, teamMembers]);

  const handleSelect = (userId: string | null) => {
    onChange(userId);
    setOpen(false);
  };

  // Memoize display name
  const displayName = useMemo(() => {
    if (selectedMember) {
      return selectedMember.full_name || selectedMember.email || "Unknown";
    }
    if (suggestedRole && !value) {
      return suggestedRole;
    }
    return "Unassigned";
  }, [selectedMember, suggestedRole, value]);

  const buttonClasses = cn(
    "flex items-center gap-1 rounded px-2 py-1 transition-colors",
    "hover:bg-gray-100 disabled:opacity-50",
    !value && "text-gray-500",
    size === "sm" ? "text-xs" : "text-sm"
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={buttonClasses}
          onClick={(e) => e.stopPropagation()}
        >
          <User className={cn(size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
          <span>{displayName}</span>
          <ChevronDown
            className={cn(
              "text-gray-400",
              size === "sm" ? "h-3 w-3" : "h-4 w-4"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="end">
        <div className="space-y-1 max-h-96 overflow-y-auto">
          {/* Suggested section */}
          {suggested.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase">
                Suggested ({suggestedRole})
              </div>
              {suggested.map((member) => {
                const isSelected = member.user_id === value;
                const userName = member.full_name || member.email || "Unknown";
                // Find the trial where this member has the suggested role
                const matchingTrial = member.trials.find(
                  (t) => t.trial_role === suggestedRole
                );

                return (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => handleSelect(member.user_id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors",
                      "hover:bg-gray-100",
                      isSelected && "bg-gray-50"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                      {userName?.charAt(0).toUpperCase() || "?"}
                    </div>

                    {/* Name and role */}
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-gray-900">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {matchingTrial?.trial_role || suggestedRole}
                        {member.trials.length > 1 &&
                          ` (+${member.trials.length - 1} trials)`}
                      </p>
                    </div>

                    {/* Check icon */}
                    {isSelected && <Check className="h-3 w-3 text-blue-600" />}
                  </button>
                );
              })}
            </>
          )}

          {/* Others section */}
          {others.length > 0 && (
            <>
              {suggested.length > 0 && (
                <div className="my-1 border-t border-gray-200" />
              )}
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase">
                {suggested.length > 0 ? "Others" : "Team Members"}
              </div>
              {others.map((member) => {
                const isSelected = member.user_id === value;
                const userName = member.full_name || member.email || "Unknown";

                return (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => handleSelect(member.user_id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors",
                      "hover:bg-gray-100",
                      isSelected && "bg-gray-50"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
                      {userName?.charAt(0).toUpperCase() || "?"}
                    </div>

                    {/* Name and role */}
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-gray-900">
                        {userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.trial_role}
                        {member.trials.length > 1 &&
                          ` (+${member.trials.length - 1} trials)`}
                      </p>
                    </div>

                    {/* Check icon */}
                    {isSelected && <Check className="h-3 w-3 text-gray-900" />}
                  </button>
                );
              })}
            </>
          )}

          {/* Unassign option */}
          <div className="my-1 border-t border-gray-200" />
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors",
              "hover:bg-gray-100",
              !value && "bg-gray-50"
            )}
          >
            <div className="flex-1 text-left">
              <p className="text-xs text-gray-500">Unassigned</p>
            </div>
            {!value && <Check className="h-3 w-3 text-gray-900" />}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
