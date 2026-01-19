/**
 * Client - Organization Service
 * Backend calls for organization operations from Client App
 * Uses /api/client/[orgId]/... endpoints
 */

import type {
  OrganizationDetails,
  AddMemberInput,
  UpdateOrganizationInput,
  Organization,
} from '../organizations/types';
import type { OrgRole } from '@/lib/permissions/constants';

/**
 * Current user's membership in an organization
 */
export interface OrgMembership {
  userId: string;
  email: string;
  orgMemberId: string;
  orgRole: OrgRole;
  isStaff: boolean;
}

/**
 * Get current user's membership in an organization
 * Lightweight endpoint for permission checks
 * Allows: any active member of the org
 */
export async function getMyMembership(orgId: string): Promise<OrgMembership> {
  const response = await fetch(`/api/client/${orgId}/me`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch membership');
  }

  return response.json();
}

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

/**
 * Update organization details
 * Allows: org admin only
 */
export async function updateOrganization(
  orgId: string,
  input: UpdateOrganizationInput
): Promise<Organization> {
  const response = await fetch(`/api/client/${orgId}/organization`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update organization');
  }

  return response.json();
}
