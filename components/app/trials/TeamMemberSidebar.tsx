/**
 * Team Member Sidebar Component
 * Sidebar panel showing team member details with editable fields
 */

"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SelectPopover } from "@/components/ui/select-popover";
import { EditableText } from "@/components/app/shared/EditableField";
import { User, Trash2 } from "lucide-react";
import {
  TRIAL_ROLE_OPTIONS,
  TEAM_MEMBER_STATUS_OPTIONS,
} from "@/lib/constants/trials";
import type { TrialTeamMember, TrialRole } from "@/services/trials/types";

interface TeamMemberSidebarProps {
  member: TrialTeamMember;
  canManageTeam: boolean;
  canAssignPI: boolean;
  onUpdateRole: (orgMemberId: string, role: TrialRole) => Promise<void>;
  onUpdateStatus: (
    orgMemberId: string,
    status: "active" | "inactive"
  ) => Promise<void>;
  onUpdateSettings: (
    orgMemberId: string,
    settings: { notes?: string; contact_info?: string }
  ) => Promise<void>;
  onRemove: (orgMemberId: string) => Promise<void>;
}

export function TeamMemberSidebar({
  member,
  canManageTeam,
  canAssignPI,
  onUpdateRole,
  onUpdateStatus,
  onUpdateSettings,
  onRemove,
}: TeamMemberSidebarProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  // Determine if user can edit this member's role
  const canEditRole = member.trial_role === "PI" ? canAssignPI : canManageTeam;

  // Filter available roles based on permissions
  const availableRoles = canAssignPI
    ? TRIAL_ROLE_OPTIONS
    : TRIAL_ROLE_OPTIONS.filter((r) => r.value !== "PI");

  const handleRemove = async () => {
    if (
      !confirm(
        `Are you sure you want to remove ${
          member.user?.full_name || member.user?.email || "this member"
        } from the trial team?${
          member.trial_role === "PI"
            ? " This will remove the Principal Investigator role."
            : ""
        }`
      )
    ) {
      return;
    }

    setIsRemoving(true);
    try {
      await onRemove(member.org_member_id);
    } catch (error) {
      console.error("Failed to remove member:", error);
      setIsRemoving(false);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    await onUpdateSettings(member.org_member_id, {
      ...member.settings,
      notes,
    });
  };

  const handleUpdateContactInfo = async (contactInfo: string) => {
    await onUpdateSettings(member.org_member_id, {
      ...member.settings,
      contact_info: contactInfo,
    });
  };

  const notes = member.settings?.notes || "";
  const contactInfo = member.settings?.contact_info || "";

  return (
    <Card className="sticky top-6 w-80 shrink-0">
      <CardContent className="px-4 space-y-4">
        {/* Header with avatar */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-6 w-6 text-gray-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {member.user?.full_name || "Unknown"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {member.user?.email}
            </p>
          </div>
        </div>

        {/* Trial Role */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Trial Role
          </label>
          <SelectPopover
            value={member.trial_role}
            options={availableRoles}
            onSelect={(value) =>
              onUpdateRole(member.org_member_id, value as TrialRole)
            }
            disabled={!canEditRole}
            className="w-auto"
          />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Status
          </label>
          <SelectPopover
            value={member.status || "active"}
            options={TEAM_MEMBER_STATUS_OPTIONS}
            onSelect={(value) =>
              onUpdateStatus(
                member.org_member_id,
                value as "active" | "inactive"
              )
            }
            disabled={!canManageTeam}
            className="w-auto"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Notes
          </label>
          <EditableText
            value={notes}
            placeholder="Add notes..."
            onSave={handleUpdateNotes}
            multiline
            disabled={!canManageTeam}
            className="text-sm text-gray-700"
          />
        </div>

        {/* Contact Info */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Phone
          </label>
          <EditableText
            value={contactInfo}
            placeholder="Add phone..."
            onSave={handleUpdateContactInfo}
            disabled={!canManageTeam}
            className="text-sm text-gray-700"
          />
        </div>

        {/* Work Load (placeholder) */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 uppercase">
            Work Load
          </label>
          <div className="text-sm text-gray-600">
            <p>0 tasks</p>
            <p>0 patients</p>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Remove button */}
        {canManageTeam && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={
              isRemoving || (member.trial_role === "PI" && !canAssignPI)
            }
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            {isRemoving ? "Removing..." : "Remove from Trial"}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
