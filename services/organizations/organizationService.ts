/**
 * Organization Service
 * Backend calls for organization operations
 */

import type {
  Organization,
  CreateOrganizationInput,
  OrganizationListResponse,
} from './types';

/**
 * Fetch all organizations (staff only)
 */
export async function getOrganizations(): Promise<OrganizationListResponse> {
  const response = await fetch('/api/organizations', {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch organizations');
  }

  return response.json();
}

/**
 * Create new organization (staff only)
 */
export async function createOrganization(
  input: CreateOrganizationInput
): Promise<Organization> {
  const response = await fetch('/api/organizations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create organization');
  }

  return response.json();
}

/**
 * Toggle support mode for organization (staff only)
 */
export async function toggleSupportMode(
  orgId: string,
  enabled: boolean
): Promise<Organization> {
  const response = await fetch(
    `/api/organizations/${orgId}/support`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ support_enabled: enabled }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to toggle support mode');
  }

  return response.json();
}
