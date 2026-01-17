/**
 * OrganizationMembers Component
 * Displays organization members in a simple table
 */

"use client";

import { useState } from "react";
import { useOrganization } from "@/hooks/client/useOrganization";
import { User, Plus } from "lucide-react";
import { InviteMemberModal } from "./InviteMemberModal";

interface OrganizationMembersProps {
  orgId: string;
}

export function OrganizationMembers({ orgId }: OrganizationMembersProps) {
  const { members, isLoading, inviteMember, isInviting } = useOrganization(orgId);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleInvite = async (invites: { email: string; org_role: "superadmin" | "admin" | "editor" | "reader" }[]) => {
    // Send invitations sequentially
    for (const invite of invites) {
      await inviteMember(invite);
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
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 last:border-b-0">
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
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-gray-900">Members</h2>
            <span className="text-sm text-gray-500">
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            Invite
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-4">Name</div>
        <div className="col-span-4">Email</div>
        <div className="col-span-2">Role</div>
        <div className="col-span-2">Status</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {members.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No members found
          </div>
        ) : (
          members.map((member) => (
            <div
              key={member.user_id}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors"
            >
              {/* Name */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <User className="h-4 w-4 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {member.user.first_name || member.user.email.split("@")[0]}
                  </p>
                  {member.user.last_name && (
                    <p className="text-xs text-gray-500">{member.user.last_name}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="col-span-4">
                <p className="text-sm text-gray-600">{member.user.email}</p>
              </div>

              {/* Role */}
              <div className="col-span-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                  {member.org_role}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2">
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${member.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <span className="text-sm text-gray-600 capitalize">{member.status}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInvite}
        isLoading={isInviting}
      />
    </div>
  );
}
