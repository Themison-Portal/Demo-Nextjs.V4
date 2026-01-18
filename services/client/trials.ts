/**
 * Client - Trials Service
 * Backend calls for trial operations from Client App
 * Uses /api/client/[orgId]/trials endpoints
 */

import type {
  TrialListResponse,
  TrialDetails,
  Trial,
  CreateTrialInput,
  UpdateTrialInput,
  TrialTeamMember,
  AddTrialTeamMemberInput,
} from '../trials/types';

/**
 * Get all trials for an organization
 * Allows: org superadmin, admin, or staff with support enabled
 */
export async function getTrials(orgId: string): Promise<TrialListResponse> {
  const response = await fetch(`/api/client/${orgId}/trials`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trials');
  }

  return response.json();
}

/**
 * Get a single trial with full details
 * Allows: org superadmin, admin, or staff with support enabled
 */
export async function getTrialById(
  orgId: string,
  trialId: string
): Promise<TrialDetails> {
  const response = await fetch(`/api/client/${orgId}/trials/${trialId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trial');
  }

  return response.json();
}

/**
 * Create a new trial
 * Allows: org superadmin, admin, or staff with support enabled
 */
export async function createTrial(
  orgId: string,
  input: CreateTrialInput
): Promise<Trial> {
  const response = await fetch(`/api/client/${orgId}/trials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create trial');
  }

  return response.json();
}

/**
 * Update a trial
 * Allows: org superadmin, admin, or staff with support enabled
 */
export async function updateTrial(
  orgId: string,
  trialId: string,
  input: UpdateTrialInput
): Promise<Trial> {
  const response = await fetch(`/api/client/${orgId}/trials/${trialId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update trial');
  }

  return response.json();
}

// ============================================================================
// TRIAL TEAM MEMBERS
// ============================================================================

/**
 * Get trial team members
 */
export async function getTrialTeam(
  orgId: string,
  trialId: string
): Promise<{ team_members: TrialTeamMember[] }> {
  const response = await fetch(`/api/client/${orgId}/trials/${trialId}/team`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch trial team');
  }

  return response.json();
}

/**
 * Add or update trial team member
 * If member exists, updates their role
 */
export async function addTrialTeamMember(
  orgId: string,
  trialId: string,
  input: AddTrialTeamMemberInput
): Promise<TrialTeamMember> {
  const response = await fetch(`/api/client/${orgId}/trials/${trialId}/team`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to add team member');
  }

  return response.json();
}

/**
 * Update trial team member role
 */
export async function updateTrialTeamMember(
  orgId: string,
  trialId: string,
  orgMemberId: string,
  trialRole: string
): Promise<TrialTeamMember> {
  const response = await fetch(`/api/client/${orgId}/trials/${trialId}/team`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ org_member_id: orgMemberId, trial_role: trialRole }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update team member');
  }

  return response.json();
}

/**
 * Remove trial team member
 */
export async function removeTrialTeamMember(
  orgId: string,
  trialId: string,
  orgMemberId: string
): Promise<void> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/team?org_member_id=${orgMemberId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to remove team member');
  }
}
