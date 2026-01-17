/**
 * Client - Organization Service
 * Backend calls for organization operations from Client App
 * Uses /api/client/[orgId]/... endpoints
 */

import type {
  OrganizationDetails,
  AddMemberInput,
} from '../organizations/types';

/**
 * Get organization with members
 * Allows: org superadmin, admin, or staff with support enabled
 */
export async function getOrganization(
  orgId: string
): Promise<OrganizationDetails> {
  const response = await fetch(`/api/client/${orgId}/organization`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch organization');
  }

  return response.json();
}

/**
 * Invite member to organization
 * Creates invitation - member will be added when they accept and complete signup
 * Allows: org superadmin, admin, or staff with support enabled
 */
export async function inviteMember(
  orgId: string,
  input: AddMemberInput
): Promise<void> {
  const response = await fetch(`/api/client/${orgId}/organization/members`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to invite member');
  }
}

/**
 * Remove member from organization
 * Allows: org superadmin, admin, or staff with support enabled
 */
export async function removeMember(
  orgId: string,
  userId: string
): Promise<void> {
  const response = await fetch(
    `/api/client/${orgId}/organization/members/${userId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove member');
  }
}
