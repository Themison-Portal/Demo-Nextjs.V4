/**
 * usePermissions Hook
 * Centralized org-level permission hook
 *
 * Usage:
 *   const { canCreateTrial, canInviteMembers } = usePermissions(orgId)
 *   {canCreateTrial && <CreateTrialButton />}
 */

'use client';

import { useMemo } from 'react';
import { useOrgMembership } from '@/hooks/client/useOrgMembership';
import {
  getOrgPermissions,
  getAssignableRoles,
  isAdminRole,
  type OrgPermissions,
  type OrgRole,
} from '@/lib/permissions/constants';

export interface UsePermissionsResult extends OrgPermissions {
  // Loading state
  isLoading: boolean;

  // Role info
  orgRole: OrgRole | null;
  isAdmin: boolean;
  isStaff: boolean;

  // Helpers
  assignableRoles: OrgRole[];
}

/**
 * Hook for org-level permissions
 * @param orgId - Organization ID
 * @returns Permissions object with loading state
 */
export function usePermissions(orgId: string): UsePermissionsResult {
  const { orgRole, isStaff, isLoading } = useOrgMembership(orgId);

  const permissions = useMemo(() => {
    return getOrgPermissions(orgRole);
  }, [orgRole]);

  const assignableRoles = useMemo(() => {
    if (!orgRole) return [];
    return getAssignableRoles(orgRole);
  }, [orgRole]);

  return {
    ...permissions,
    isLoading,
    orgRole,
    isAdmin: isAdminRole(orgRole),
    isStaff,
    assignableRoles,
  };
}
