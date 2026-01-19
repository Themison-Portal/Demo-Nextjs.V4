/**
 * Add Team Member Modal Component
 * Modal to add organization members to a trial team
 */

"use client";

import { useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { useOrganization } from "@/hooks/client/useOrganization";
import { TRIAL_ROLE_OPTIONS } from "@/lib/constants/trials";
import type { TrialRole, TrialTeamMember } from "@/services/trials/types";
import type { AddTrialTeamMemberInput } from "@/services/trials/types";
import { FileWarning } from "lucide-react";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: AddTrialTeamMemberInput) => Promise<void>;
  orgId: string;
  existingMembers: TrialTeamMember[];
  canAssignPI: boolean;
  canInviteMembers?: boolean;
  onOpenInviteModal?: () => void;
  isLoading?: boolean;
}

export function AddTeamMemberModal({
  isOpen,
  onClose,
  onSubmit,
  orgId,
  existingMembers,
  canAssignPI,
  canInviteMembers = false,
  onOpenInviteModal,
  isLoading = false,
}: AddTeamMemberModalProps) {
  const { members } = useOrganization(orgId);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<TrialRole>("CRC");
  const [error, setError] = useState<string | null>(null);

  // Filter out members who are already in the team
  const existingMemberIds = new Set(
    existingMembers.map((m) => m.org_member_id)
  );
  const availableMembers = members.filter((m) => !existingMemberIds.has(m.id));

  // Filter roles based on permissions
  const availableRoles = canAssignPI
    ? TRIAL_ROLE_OPTIONS
    : TRIAL_ROLE_OPTIONS.filter((r) => r.value !== "PI");

  const handleSubmit = async () => {
    setError(null);

    if (!selectedMemberId) {
      setError("Please select a team member");
      return;
    }

    if (!selectedRole) {
      setError("Please select a role");
      return;
    }

    try {
      await onSubmit({
        org_member_id: selectedMemberId,
        trial_role: selectedRole,
      });
      handleClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add team member"
      );
    }
  };

  const handleClose = () => {
    setSelectedMemberId("");
    setSelectedRole("CRC");
    setError(null);
    onClose();
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <ModalHeader onClose={handleClose}>Add Team Member</ModalHeader>

      <ModalBody className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        {availableMembers.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-md bg-gray-50 px-3 py-3 text-sm text-gray-700 flex items-start gap-2">
              <FileWarning className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">All members assigned</p>
                <p className="text-gray-600 mt-1">
                  All organization members are already part of this trial team.
                </p>
              </div>
            </div>

            {canInviteMembers && onOpenInviteModal && (
              <div className="rounded-md bg-blue-50 px-3 py-3 text-sm">
                <p className="text-gray-700 mb-2">
                  Would you like to invite more people to the organization?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    onOpenInviteModal();
                  }}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Invite to Organization
                </button>
              </div>
            )}
          </div>
        )}

        {availableMembers.length > 0 && (
          <>
            <p className="text-sm text-gray-500">
              Select an organization member to add to the trial team
            </p>

            {/* Member selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Team Member
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                disabled={isLoading}
                className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
              >
                <option value="">Select a member...</option>
                {availableMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user?.full_name || member.user?.email || "Unknown"}
                  </option>
                ))}
              </select>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Trial Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as TrialRole)}
                disabled={isLoading}
                className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
              >
                {availableRoles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Preview */}
            {selectedMember && (
              <div className="rounded-md bg-gray-50 px-3 py-2 text-sm">
                <p className="font-medium text-gray-900">
                  {selectedMember.user?.full_name || "Unknown"}
                </p>
                <p className="text-gray-500">{selectedMember.user?.email}</p>
                <p className="text-gray-600 mt-1">
                  Role:{" "}
                  {availableRoles.find((r) => r.value === selectedRole)?.label}
                </p>
              </div>
            )}
          </>
        )}
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={handleClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isLoading || !selectedMemberId || availableMembers.length === 0
          }
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Adding..." : "Add Member"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
