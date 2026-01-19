/**
 * Trial Team Component
 * Displays and manages trial team members
 */

"use client";

import { useState } from "react";
import { useTrialTeam } from "@/hooks/client/useTrialTeam";
import { useTrialPermissions } from "@/hooks/useTrialPermissions";
import { useTrialDetails } from "@/hooks/client/useTrialDetails";
import { usePermissions } from "@/hooks/usePermissions";
import { useOrganization } from "@/hooks/client/useOrganization";
import { User, Plus } from "lucide-react";
import { AddTeamMemberModal } from "./AddTeamMemberModal";
import { TeamMemberSidebar } from "./TeamMemberSidebar";
import { InviteMemberModal } from "@/components/app/organization/InviteMemberModal";
import { formatDate } from "@/lib/date";
import type { TrialTeamMember } from "@/services/trials/types";
import type { OrgRole } from "@/lib/permissions/constants";

interface TrialTeamProps {
  orgId: string;
  trialId: string;
}

export function TrialTeam({ orgId, trialId }: TrialTeamProps) {
  const {
    teamMembers,
    isLoading,
    addTeamMember,
    isAdding,
    updateRole,
    updateSettings,
    updateStatus,
    removeMember,
  } = useTrialTeam(orgId, trialId);

  // Get trial details to pass to permissions hook
  const { trial, teamMembers: teamMembersForPermissions } = useTrialDetails(
    orgId,
    trialId
  );
  const { canManageTeam, canAssignPI } = useTrialPermissions(
    orgId,
    teamMembersForPermissions
  );

  // Get org-level permissions for inviting
  const { canInviteMembers } = usePermissions(orgId);
  const { inviteMember, isInviting } = useOrganization(orgId);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Find the selected member from the current team members list (always fresh data)
  const selectedMember = selectedMemberId
    ? teamMembers.find((m) => m.id === selectedMemberId) || null
    : null;

  const handleAddMember = async (input: {
    org_member_id: string;
    trial_role: string;
  }) => {
    await addTeamMember(input);
    setIsAddModalOpen(false);
  };

  const handleInvite = async (
    invites: { email: string; org_role: OrgRole }[]
  ) => {
    // Send invitations sequentially
    for (const invite of invites) {
      await inviteMember(invite);
    }
  };

  const handleSelectMember = (member: TrialTeamMember) => {
    // Toggle selection
    if (selectedMemberId === member.id) {
      setSelectedMemberId(null);
    } else {
      setSelectedMemberId(member.id);
    }
  };

  // When a member is removed, clear selection if it was the selected member
  const handleRemoveMember = async (orgMemberId: string) => {
    await removeMember(orgMemberId);
    const removedMember = teamMembers.find(
      (m) => m.org_member_id === orgMemberId
    );
    if (removedMember && selectedMemberId === removedMember.id) {
      setSelectedMemberId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="h-6 w-32 bg-gray-100 animate-pulse rounded" />
        </div>
        <div className="border-t border-gray-200">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0"
            >
              <div className="h-8 w-8 bg-gray-100 animate-pulse rounded-full" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-gray-100 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left: Table */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-medium text-gray-900">
                Team Members
              </h2>
              <span className="text-sm text-gray-500">
                {teamMembers.length}{" "}
                {teamMembers.length === 1 ? "member" : "members"}
              </span>
            </div>
            {canManageTeam && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Member
              </button>
            )}
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
          <div className="col-span-3">Name</div>
          <div className="col-span-3">Email</div>
          <div className="col-span-2">Trial Role</div>
          <div className="col-span-2">Assigned Date</div>
          <div className="col-span-2">Status</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-100">
          {teamMembers.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No team members yet. Add members to get started.
            </div>
          ) : (
            teamMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer transition-colors ${
                  selectedMemberId === member.id
                    ? "bg-blue-50 hover:bg-blue-100"
                    : "hover:bg-gray-50"
                } ${member.status === "inactive" ? "opacity-60" : ""}`}
              >
                {/* Name */}
                <div className="col-span-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user?.full_name || "Unknown"}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-3">
                  <p className="text-sm text-gray-600 truncate">
                    {member.user?.email}
                  </p>
                </div>

                {/* Trial Role */}
                <div className="col-span-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      member.trial_role === "PI"
                        ? "bg-purple-50 text-purple-700"
                        : member.trial_role === "CRC"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    {member.trial_role}
                  </span>
                </div>

                {/* Assigned Date */}
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">
                    {formatDate(member.assigned_at)}
                  </p>
                </div>

                {/* Status */}
                <div className="col-span-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        member.status === "inactive"
                          ? "bg-gray-400"
                          : "bg-green-500"
                      }`}
                    />
                    <span className="text-sm text-gray-600 capitalize">
                      {member.status || "active"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right: Sidebar (conditional) */}
      {selectedMember && (
        <TeamMemberSidebar
          member={selectedMember}
          canManageTeam={canManageTeam}
          canAssignPI={canAssignPI}
          onUpdateRole={updateRole}
          onUpdateStatus={updateStatus}
          onUpdateSettings={updateSettings}
          onRemove={handleRemoveMember}
        />
      )}

      {/* Add Member Modal */}
      {canManageTeam && (
        <AddTeamMemberModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddMember}
          orgId={orgId}
          existingMembers={teamMembers}
          canAssignPI={canAssignPI}
          canInviteMembers={canInviteMembers}
          onOpenInviteModal={() => setIsInviteModalOpen(true)}
          isLoading={isAdding}
        />
      )}

      {/* Invite Member Modal */}
      {canInviteMembers && (
        <InviteMemberModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          onSubmit={handleInvite}
          isLoading={isInviting}
        />
      )}
    </div>
  );
}
