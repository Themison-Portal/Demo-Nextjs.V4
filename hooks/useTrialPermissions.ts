/**
 * useTrialPermissions Hook
 * Centralized trial-level permission hook
 *
 * Usage:
 *   // Option 1: When you already have trial data loaded
 *   const { canEditTrial, canManageTeam } = useTrialPermissions(orgId, teamMembers)
 *
 *   // In component:
 *   {canEditTrial && <EditableField ... />}
 */

'use client';

import { useMemo } from 'react';
import { useOrgMembership } from '@/hooks/client/useOrgMembership';
import {
  getTrialPermissions,
  type TrialPermissions,
  type OrgRole,
  type TrialRole,
} from '@/lib/permissions/constants';
import type { TrialTeamMember } from '@/services/trials/types';

export interface UseTrialPermissionsResult extends TrialPermissions {
  // Loading state
  isLoading: boolean;

  // Role info
  orgRole: OrgRole | null;
  trialRole: TrialRole | null;
  isTrialMember: boolean;
}

/**
 * Hook for trial-level permissions
 * @param orgId - Organization ID
 * @param teamMembers - Team members array from useTrialDetails (optional)
 * @returns Permissions object with loading state
 */
export function useTrialPermissions(
  orgId: string,
  teamMembers: TrialTeamMember[] = []
): UseTrialPermissionsResult {
  const { orgRole, orgMemberId, isLoading: isMembershipLoading } = useOrgMembership(orgId);

  // Find current user's role in the trial
  const trialRole = useMemo(() => {
    // Staff has implicit admin access, no trial role needed
    if (orgMemberId === 'staff') return null;

    // Can't determine role without membership ID
    if (!orgMemberId) return null;

    const membership = teamMembers.find(
      (member) => member.org_member_id === orgMemberId
    );
    return (membership?.trial_role as TrialRole) ?? null;
  }, [teamMembers, orgMemberId]);

  // Calculate permissions only when we have the necessary data
  const permissions = useMemo(() => {
    // If still loading membership, return restrictive permissions
    // (but canViewTrial true so UI doesn't flash "no access")
    if (isMembershipLoading || !orgRole) {
      return getTrialPermissions(null, null);
    }

    return getTrialPermissions(orgRole, trialRole);
  }, [orgRole, trialRole, isMembershipLoading]);

  // Combined loading state: membership loading OR teamMembers not yet populated
  const isLoading = isMembershipLoading;

  return {
    ...permissions,
    isLoading,
    orgRole,
    trialRole,
    isTrialMember: !!trialRole,
  };
}
