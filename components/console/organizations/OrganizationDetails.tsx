"use client";

/**
 * Organization Details Component
 * Shows organization details with ability to edit and manage members
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationDetails } from "@/hooks/useOrganizationDetails";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  ArrowLeft,
  Building,
  Calendar,
  Hash,
  Users,
  Mail,
  Trash2,
  UserPlus,
} from "lucide-react";

interface OrganizationDetailsProps {
  id: string;
}

export function OrganizationDetails({ id }: OrganizationDetailsProps) {
  const router = useRouter();
  const {
    organization,
    members,
    invitations,
    isLoading,
    error,
    updateOrganization,
    isUpdating,
    inviteMember,
    isInviting,
    removeMember,
    isRemoving,
  } = useOrganizationDetails(id);

  // Form state
  const [name, setName] = useState("");
  const [supportEnabled, setSupportEnabled] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Add member form state
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<
    "superadmin" | "admin" | "editor" | "reader"
  >("reader");

  // Error state
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form when organization loads
  useEffect(() => {
    if (organization) {
      setName(organization.name);
      setSupportEnabled(organization.support_enabled);
    }
  }, [organization]);

  // Track changes
  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(
      value !== organization?.name ||
        supportEnabled !== organization?.support_enabled
    );
  };

  const handleSupportToggle = (checked: boolean) => {
    setSupportEnabled(checked);
    setHasChanges(
      name !== organization?.name || checked !== organization?.support_enabled
    );
  };

  // Save changes
  const handleSave = async () => {
    if (!organization) return;

    setFormError(null);
    try {
      await updateOrganization({
        name: name !== organization.name ? name : undefined,
        support_enabled:
          supportEnabled !== organization.support_enabled
            ? supportEnabled
            : undefined,
      });
      setHasChanges(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update organization"
      );
    }
  };

  // Invite member
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      await inviteMember({
        email: newMemberEmail,
        org_role: newMemberRole,
      });
      setNewMemberEmail("");
      setNewMemberRole("reader");
      setShowAddMember(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to invite member"
      );
    }
  };

  // Remove member
  const handleRemoveMember = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${userEmail}?`)) return;

    setFormError(null);
    try {
      await removeMember(userId);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to remove member"
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  // Error state
  if (error || !organization) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error?.message || "Organization not found"}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {organization.name}
          </h1>
        </div>
        {hasChanges && (
          <Button onClick={handleSave} disabled={isUpdating}>
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      {/* Error message */}
      {formError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Details Card */}
        <div className="rounded-md border border-gray-200 bg-white p-6">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-gray-900">
            <Building className="h-5 w-5" />
            Organization Details
          </h2>
          <div className="flex items-center gap-1 rounded-md  text-sm text-gray-600 my-2">
            <p>Created @</p>

            {new Date(organization.created_at).toLocaleDateString("en-UK", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>

          <div className="space-y-4">
            {/* Name */}
            <div>
              <Label htmlFor="name" className="mb-2">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Organization name"
              />
            </div>

            {/* Slug (read-only) */}
            <div>
              <Label className="mb-2">Slug</Label>
              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                <Hash className="h-4 w-4" />
                {organization.slug || "N/A"}
              </div>
            </div>

            {/* Created At */}

            {/* Status */}
            <div>
              <Label className="mb-2">Status</Label>
              <div>
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    organization.deleted_at
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {organization.deleted_at ? "Inactive" : "Active"}
                </span>
              </div>
            </div>

            {/* Support Mode Toggle */}
            <div className="mb-4">
              <Label
                htmlFor="support-enabled"
                className="flex items-center gap-2"
              >
                <input
                  id="support-enabled"
                  type="checkbox"
                  checked={supportEnabled}
                  onChange={(e) => handleSupportToggle(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-gray-600 focus:ring-gray-400"
                />
                Support Mode Enabled
              </Label>
              <p className="mt-1 text-xs text-gray-500">
                Allow Themison staff to access this organization
              </p>
            </div>
          </div>

          {/* Members Card */}
        </div>
        <div className="rounded-md border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <Users className="h-5 w-5" />
              Members ({members.length + invitations.length})
            </h2>
            <Button
              onClick={() => setShowAddMember(!showAddMember)}
              variant="outline"
              size="sm"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <form
              onSubmit={handleInviteMember}
              className="mb-4 rounded-md border border-gray-200 bg-gray-50 p-4"
            >
              <div className="space-y-3">
                <div>
                  <Label htmlFor="new-member-email" className="mb-2">
                    Email
                  </Label>
                  <Input
                    id="new-member-email"
                    type="email"
                    className="bg-white"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="member@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-member-role" className="mb-2">
                    Role
                  </Label>
                  <select
                    id="new-member-role"
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as any)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                  >
                    <option value="superadmin">Superadmin</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="reader">Reader</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={isInviting}>
                    {isInviting ? "Sending..." : "Send Invitation"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddMember(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Members List */}
          {members.length === 0 && invitations.length === 0 ? (
            <div className="rounded-md border border-gray-200 bg-gray-50 p-8 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No members yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Invite members to get started
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Active Members */}
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between rounded-md border border-gray-200 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {member.user.first_name || member.user.last_name
                          ? `${member.user.first_name || ""} ${
                              member.user.last_name || ""
                            }`.trim()
                          : member.user.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {member.org_role}
                    </span>
                    <button
                      onClick={() =>
                        handleRemoveMember(member.user_id, member.user.email)
                      }
                      disabled={isRemoving}
                      className="text-red-600 hover:text-red-700 disabled:opacity-50"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {invitations.length > 0 && (
                <div className="mb-2">
                  <small>{`The following member${
                    invitations.length == 1 ? " hasn't" : "s haven't"
                  } accepted yet`}</small>
                </div>
              )}

              {/* Pending Invitations */}
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invitation.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Invited • Expires{" "}
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className=" capitalize inline-flex rounded-full text-xs font-bold text-gray-600">
                      {invitation.org_role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
