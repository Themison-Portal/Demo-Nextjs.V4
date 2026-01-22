"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TrialTeamMember } from "@/services/trials/types";

interface ActivityAssigneeSelectProps {
  value?: string | null; // user_id
  suggestedRole?: string | null; // Role from template
  teamMembers: TrialTeamMember[];
  onChange: (userId: string | null) => void;
  disabled?: boolean;
}

export function ActivityAssigneeSelect({
  value,
  suggestedRole,
  teamMembers,
  onChange,
  disabled = false,
}: ActivityAssigneeSelectProps) {
  const [open, setOpen] = useState(false);

  // Group members by suggested role
  const suggested = teamMembers.filter((m) => m.trial_role === suggestedRole);
  const others = teamMembers.filter((m) => m.trial_role !== suggestedRole);

  // Find selected member
  const selectedMember = value ? teamMembers.find((m) => m.user?.id === value) : null;

  const handleSelect = (userId: string | null) => {
    onChange(userId);
    setOpen(false);
  };

  // Display name logic
  let displayName = "Unassigned";
  if (selectedMember?.user) {
    displayName = selectedMember.user.full_name || selectedMember.user.email || "Unknown";
  } else if (suggestedRole && !value) {
    displayName = suggestedRole;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-1 text-xs rounded px-2 py-1 transition-colors",
            "hover:bg-gray-100 disabled:opacity-50 text-gray-700",
            !value && "text-gray-500"
          )}
        >
          <span>{displayName}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-1" align="end">
        <div className="space-y-1">
          {/* Suggested section */}
          {suggested.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase">
                Suggested
              </div>
              {suggested.map((member) => {
                const isSelected = member.user?.id === value;
                const userName = member.user?.full_name || member.user?.email || "Unknown";
                return (
                  <button
                    key={member.user?.id || member.id}
                    type="button"
                    onClick={() => handleSelect(member.user?.id || null)}
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
                      </p>
                    </div>

                    {/* Check icon */}
                    {isSelected && (
                      <Check className="h-3 w-3 text-gray-900" />
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Others section */}
          {others.length > 0 && (
            <>
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase">
                Others
              </div>
              {others.map((member) => {
                const isSelected = member.user?.id === value;
                const userName = member.user?.full_name || member.user?.email || "Unknown";
                return (
                  <button
                    key={member.user?.id || member.id}
                    type="button"
                    onClick={() => handleSelect(member.user?.id || null)}
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
                      </p>
                    </div>

                    {/* Check icon */}
                    {isSelected && (
                      <Check className="h-3 w-3 text-gray-900" />
                    )}
                  </button>
                );
              })}
            </>
          )}

          {/* Unassign option */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded transition-colors border-t border-gray-200 mt-1 pt-2",
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
