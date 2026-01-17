/**
 * Console - Organization Service
 * Backend calls for organization operations from Console
 * Uses /api/console/organizations/... endpoints
 * Staff only - no support_enabled restrictions
 */

import type {
  Organization,
  CreateOrganizationInput,
  OrganizationListResponse,
  OrganizationDetails,
  UpdateOrganizationInput,
  AddMemberInput,
} from '../organizations/types';

/**
 * Fetch all organizations (staff only)
 */
export async function getOrganizations(): Promise<OrganizationListResponse> {
  const response = await fetch('/api/console/organizations', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch organizations');
  }

  return response.json();
}

/**
 * Create new organization (staff only)
 */
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  const response = await fetch('/api/console/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create organization');
  }

  return response.json();
}

/**
 * Get organization by ID with members (staff only)
 */
export async function getOrganizationById(
  id: string
): Promise<OrganizationDetails> {
  const response = await fetch(`/api/console/organizations/${id}`, {
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
 * Update organization (name, support_enabled) (staff only)
 */
export async function updateOrganization(
  id: string,
  input: UpdateOrganizationInput
): Promise<Organization> {
  const response = await fetch(`/api/console/organizations/${id}`, {
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

/**
 * Invite member to organization (staff only)
 */
export async function inviteMemberToOrganization(
  orgId: string,
  input: AddMemberInput
): Promise<void> {
  const response = await fetch(`/api/console/organizations/${orgId}/members`, {
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
 * Remove member from organization (staff only)
 */
export async function removeOrganizationMember(
  orgId: string,
  userId: string
): Promise<void> {
  const response = await fetch(
    `/api/console/organizations/${orgId}/members/${userId}`,
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
