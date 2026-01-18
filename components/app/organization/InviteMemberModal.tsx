/**
 * Invite Member Modal Component
 * Modal to invite new members to organization
 * Supports multiple invitations at once (like Vercel)
 */

"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { ORG_ROLES, type OrgRole } from "@/lib/permissions/constants";

interface InviteEntry {
  id: string;
  email: string;
  role: OrgRole;
}

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invites: { email: string; org_role: OrgRole }[]) => Promise<void>;
  isLoading?: boolean;
}

/** Format role for display (capitalize) */
function formatRoleLabel(role: OrgRole): string {
  if (role === "superadmin") return "Super Admin";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function InviteMemberModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: InviteMemberModalProps) {
  const [entries, setEntries] = useState<InviteEntry[]>([
    { id: generateId(), email: "", role: "reader" },
  ]);
  const [error, setError] = useState<string | null>(null);

  const handleAddEntry = () => {
    setEntries([...entries, { id: generateId(), email: "", role: "reader" }]);
  };

  const handleRemoveEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter((e) => e.id !== id));
    }
  };

  const handleEmailChange = (id: string, email: string) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, email } : e)));
  };

  const handleRoleChange = (id: string, role: OrgRole) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, role } : e)));
  };

  const handleSubmit = async () => {
    setError(null);

    // Filter out empty entries
    const validEntries = entries.filter((e) => e.email.trim());

    if (validEntries.length === 0) {
      setError("Please enter at least one email address");
      return;
    }

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmail = validEntries.find((e) => !emailRegex.test(e.email));
    if (invalidEmail) {
      setError(`Invalid email: ${invalidEmail.email}`);
      return;
    }

    try {
      await onSubmit(
        validEntries.map((e) => ({ email: e.email, org_role: e.role }))
      );
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitations");
    }
  };

  const handleClose = () => {
    setEntries([{ id: generateId(), email: "", role: "reader" }]);
    setError(null);
    onClose();
  };

  const hasValidEntry = entries.some((e) => e.email.trim());

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-xl">
      <ModalHeader onClose={handleClose}>Invite Members</ModalHeader>

      <ModalBody className="space-y-4">
        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <p className="text-sm text-gray-500">
          Invite new members by email address
        </p>

        {/* Headers */}
        <div className="grid grid-cols-12 gap-3 text-xs font-medium text-gray-500">
          <div className="col-span-7">Email Address</div>
          <div className="col-span-4">Role</div>
          <div className="col-span-1" />
        </div>

        {/* Entries */}
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <div key={entry.id} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-7">
                <Input
                  type="email"
                  value={entry.email}
                  onChange={(e) => handleEmailChange(entry.id, e.target.value)}
                  placeholder="colleague@example.com"
                  disabled={isLoading}
                  autoFocus={index === entries.length - 1}
                />
              </div>
              <div className="col-span-4">
                <select
                  value={entry.role}
                  onChange={(e) => handleRoleChange(entry.id, e.target.value as OrgRole)}
                  disabled={isLoading}
                  className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
                >
                  {ORG_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {formatRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 flex justify-center">
                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEntry(entry.id)}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add more button */}
        <button
          type="button"
          onClick={handleAddEntry}
          disabled={isLoading}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add more
        </button>
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
          disabled={isLoading || !hasValidEntry}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Sending..." : "Invite"}
        </button>
      </ModalFooter>
    </Modal>
  );
}
