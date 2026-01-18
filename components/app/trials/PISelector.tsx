/**
 * PI Selector Component
 * Dropdown to select Principal Investigator from organization members
 * Uses Popover for proper portal rendering
 */

"use client";

import { useState } from "react";
import { User, ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Member {
  id: string; // org_member_id
  user: {
    id: string;
    email: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  } | null;
}

interface PISelectorProps {
  /** Currently assigned PI org_member_id */
  currentPIOrgMemberId?: string | null;
  /** Current PI display name */
  currentPIName?: string | null;
  /** Available organization members */
  members: Member[];
  /** Called when a member is selected as PI */
  onSelect: (orgMemberId: string) => void;
  /** Whether selection is in progress */
  isLoading?: boolean;
}

function getMemberDisplayName(member: Member): string {
  if (!member.user) return "Unknown";
  return (
    member.user.full_name ||
    `${member.user.first_name || ""} ${member.user.last_name || ""}`.trim() ||
    member.user.email
  );
}

export function PISelector({
  currentPIOrgMemberId,
  currentPIName,
  members,
  onSelect,
  isLoading = false,
}: PISelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (orgMemberId: string) => {
    onSelect(orgMemberId);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isLoading}
          className="flex items-center gap-2 hover:bg-gray-100 rounded px-2 py-1 -mx-2 transition-colors disabled:opacity-50"
        >
          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-3 w-3 text-gray-500" />
          </div>
          <span className="text-sm text-gray-900">
            {currentPIName || "Not assigned"}
          </span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[250px] p-0 max-h-[300px] overflow-y-auto"
        align="start"
      >
        {members.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-500">
            No members available
          </div>
        ) : (
          members.map((member) => {
            const displayName = getMemberDisplayName(member);
            const isSelected = member.id === currentPIOrgMemberId;

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelect(member.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 transition-colors"
              >
                <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{displayName}</p>
                  {member.user?.email && displayName !== member.user.email && (
                    <p className="text-xs text-gray-500 truncate">
                      {member.user.email}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </PopoverContent>
    </Popover>
  );
}
