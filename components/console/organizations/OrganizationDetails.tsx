"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOrganizationDetails } from "@/hooks/useOrganizationDetails";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";

import {
    ArrowLeft,
    Building,
    Users,
    Mail,
    Trash2,
    UserPlus,
    Share,
} from "lucide-react";

import { APP_BASE_URL } from "@/lib/constants";
import { ORG_ROLES, type OrgRole } from "@/lib/permissions/constants";

import type {
    OrganizationDetails as OrganizationType,
    OrganizationMember,
    Invitation,
    UpdateOrganizationInput,
} from "@/services/organizations/types";

import Link from "next/link";

interface OrganizationDetailsProps {
    id: string;
}

export function OrganizationDetails({ id }: OrganizationDetailsProps) {
    const router = useRouter();

    const orgQuery = useOrganizationDetails(id);

    const organization = orgQuery.organization as OrganizationType | null;
    const members: OrganizationMember[] = orgQuery.members ?? [];
    const invitations: Invitation[] = orgQuery.invitations ?? [];

    const {
        isLoading,
        error,
        updateOrganization,
        isUpdating,
        inviteMember,
        isInviting,
        removeMember,
        isRemoving,
    } = orgQuery;

    // Form state
    const [name, setName] = useState("");
    const [supportEnabled, setSupportEnabled] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Invite form
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [newMemberRole, setNewMemberRole] = useState<OrgRole>("reader");
    const [newMemberName, setNewMemberName] = useState("");

    const [formError, setFormError] = useState<string | null>(null);

    // Initialize form
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

    // Save
    const handleSave = async () => {
        if (!organization) return;

        const payload: UpdateOrganizationInput = {};

        if (name !== organization.name) payload.name = name;
        if (supportEnabled !== organization.support_enabled) {
            payload.support_enabled = supportEnabled;
        }

        try {
            await updateOrganization(payload);
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

        try {
            await inviteMember({
                email: newMemberEmail,
                org_role: newMemberRole,
                name: newMemberName,
            });

            setNewMemberEmail("");
            setNewMemberRole("reader");
            setNewMemberName("");
            setShowAddMember(false);
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : "Failed to invite member"
            );
        }
    };

    // Remove member
    const handleRemoveMember = async (userId: string, email: string) => {
        if (!confirm(`Remove ${email}?`)) return;

        try {
            await removeMember(userId);
        } catch (err) {
            setFormError(
                err instanceof Error ? err.message : "Failed to remove member"
            );
        }
    };

    // Loading
    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    // Error
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
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
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

            {formError && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {formError}
                </div>
            )}

            <div className="flex gap-6 flex-col lg:flex-row">
                {/* Organization Card */}
                <div className="border rounded-md p-6 w-full">
                    <h2 className="flex items-center gap-2 font-bold mb-3">
                        <Building className="h-5 w-5" />
                        Organization Details
                    </h2>

                    <Label>Name</Label>
                    <Input
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                    />

                    <div className="mt-4">
                        <Label>URL</Label>

                        <div className="flex gap-2 mt-1">
                            <div className="flex-1 border rounded px-3 py-2 text-xs bg-gray-50 truncate">
                                {`${APP_BASE_URL}/${id}/dashboard`}
                            </div>

                            <Link
                                href={`${APP_BASE_URL}/${id}/dashboard`}
                                target="_blank"
                                className="border rounded px-3 flex items-center"
                            >
                                <Share className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                        <Switch
                            checked={supportEnabled}
                            onCheckedChange={handleSupportToggle}
                        />
                        <Label>
                            Support Mode {supportEnabled ? "Enabled" : "Disabled"}
                        </Label>
                    </div>
                </div>

                {/* Members */}
                <div className="border rounded-md p-6 w-full">
                    <div className="flex justify-between mb-4">
                        <h2 className="flex items-center gap-2 font-bold">
                            <Users className="h-5 w-5" />
                            Members ({members.length + invitations.length})
                        </h2>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddMember(!showAddMember)}
                        >
                            <UserPlus className="h-4 w-4" />
                            Invite
                        </Button>
                    </div>

                    {showAddMember && (
                        <form onSubmit={handleInviteMember} className="mb-4 space-y-2">
                            <Input
                                type="text"
                                placeholder="Full Name"
                                value={newMemberName}
                                onChange={(e) => setNewMemberName(e.target.value)}
                            />
                            <Input
                                type="email"
                                placeholder="Email"
                                value={newMemberEmail}
                                onChange={(e) => setNewMemberEmail(e.target.value)}
                                required
                            />

                            <select
                                value={newMemberRole}
                                onChange={(e) => setNewMemberRole(e.target.value as OrgRole)}
                                className="border rounded px-3 py-2 w-full"
                            >
                                {ORG_ROLES.map((role) => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={isInviting}>
                                    {isInviting ? "Sending..." : "Send Invite"}
                                </Button>

                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowAddMember(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}

                    <div className="space-y-2">
                        {members.map((member) => (
                            <div
                                key={member.user_id}
                                className="flex justify-between border rounded p-3"
                            >
                                <div className="flex gap-3">
                                    <Mail className="h-5 w-5 text-gray-600" />

                                    <div>
                                        <p className="text-sm font-medium">
                                            {member.user.first_name || member.user.last_name
                                                ? `${member.user.first_name ?? ""} ${member.user.last_name ?? ""
                                                }`
                                                : member.user.email}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {member.user.email}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() =>
                                        handleRemoveMember(member.user_id, member.user.email)
                                    }
                                    disabled={isRemoving}
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            </div>
                        ))}

                        {invitations.map((inv) => (
                            <div
                                key={inv.id}
                                className="border rounded p-3 flex justify-between bg-gray-50"
                            >
                                <div>
                                    <p className="text-sm">{inv.email}</p>
                                    <p className="text-xs text-gray-500">
                                        Expires{" "}
                                        {new Date(inv.expires_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <span className="text-xs font-medium capitalize">
                                    {inv.org_role}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}