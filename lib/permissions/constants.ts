/**
 * Centralized Permissions System
 *
 * This module defines all permissions based on organization and trial roles.
 * The frontend uses these to conditionally show/hide UI elements.
 * The backend MUST still validate permissions - never trust the frontend.
 */

// ============================================================================
// TYPES
// ============================================================================

export type OrgRole = 'superadmin' | 'admin' | 'editor' | 'reader';
export type TrialRole =
  | 'PI'
  | 'CRC'
  | 'Physician'
  | 'Nurse'
  | 'Data Manager'
  | 'Laboratory'
  | 'Pharmacist'
  | 'Monitor'
  | 'CR';

export interface OrgPermissions {
  // Trials
  canViewAllTrials: boolean;
  canCreateTrial: boolean;

  // Organization
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManageOrg: boolean;
  canViewOrgSettings: boolean;
}

export interface TrialPermissions {
  // Trial data
  canViewTrial: boolean;
  canEditTrial: boolean;
  canDeleteTrial: boolean;

  // Team management
  canViewTeam: boolean;
  canManageTeam: boolean;
  canAssignPI: boolean; // Only org admin can assign/change PI

  // Patients (future)
  canViewPatients: boolean;
  canManagePatients: boolean;

  // Tasks (future)
  canViewTasks: boolean;
  canManageTasks: boolean;
}

// ============================================================================
// ORG-LEVEL PERMISSIONS
// ============================================================================

const ORG_PERMISSIONS: Record<OrgRole, OrgPermissions> = {
  superadmin: {
    canViewAllTrials: true,
    canCreateTrial: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canManageOrg: true,
    canViewOrgSettings: true,
  },
  admin: {
    canViewAllTrials: true,
    canCreateTrial: true,
    canInviteMembers: true,
    canRemoveMembers: true,
    canManageOrg: true,
    canViewOrgSettings: true,
  },
  editor: {
    canViewAllTrials: false, // Only assigned trials
    canCreateTrial: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canManageOrg: false,
    canViewOrgSettings: false,
  },
  reader: {
    canViewAllTrials: false, // Only assigned trials
    canCreateTrial: false,
    canInviteMembers: false,
    canRemoveMembers: false,
    canManageOrg: false,
    canViewOrgSettings: false,
  },
};

// Default permissions for unknown roles (most restrictive)
const DEFAULT_ORG_PERMISSIONS: OrgPermissions = {
  canViewAllTrials: false,
  canCreateTrial: false,
  canInviteMembers: false,
  canRemoveMembers: false,
  canManageOrg: false,
  canViewOrgSettings: false,
};

// ============================================================================
// TRIAL-LEVEL PERMISSIONS
// ============================================================================

// ============================================================================
// ROLE CONSTANTS (exported for reuse - DRY)
// ============================================================================

/** All organization roles */
export const ORG_ROLES: OrgRole[] = ['superadmin', 'admin', 'editor', 'reader'];

/** Admin org roles that have full access */
export const ADMIN_ORG_ROLES: OrgRole[] = ['superadmin', 'admin'];

/** Critical trial roles that can perform sensitive operations */
export const CRITICAL_TRIAL_ROLES: TrialRole[] = ['PI', 'CRC'];

/** Standard trial roles for clinical trials */
export const TRIAL_ROLES: TrialRole[] = [
  'PI',
  'CRC',
  'Physician',
  'Nurse',
  'Data Manager',
  'Laboratory',
  'Pharmacist',
  'Monitor',
  'CR',
];

/**
 * Get trial permissions based on org role and trial role
 * Org admins have full access regardless of trial role
 */
export function getTrialPermissions(
  orgRole: OrgRole | null,
  trialRole: TrialRole | null
): TrialPermissions {
  const isOrgAdmin = !!(orgRole && ADMIN_ORG_ROLES.includes(orgRole));
  const isCriticalRole = !!(trialRole && CRITICAL_TRIAL_ROLES.includes(trialRole));
  const isTrialMember = !!trialRole;

  return {
    // View: any trial member or org admin
    canViewTrial: isOrgAdmin || isTrialMember,
    canViewTeam: isOrgAdmin || isTrialMember,
    canViewPatients: isOrgAdmin || isTrialMember,
    canViewTasks: isOrgAdmin || isTrialMember,

    // Edit trial properties: only org admin or PI/CRC
    canEditTrial: isOrgAdmin || isCriticalRole,

    // Manage team: org admin or PI/CRC (but not assign PI - see canAssignPI)
    canManageTeam: isOrgAdmin || isCriticalRole,

    // Assign PI: only org admin (critical role - cannot self-assign)
    canAssignPI: isOrgAdmin,

    // Delete: only org admin or PI
    canDeleteTrial: isOrgAdmin || trialRole === 'PI',

    // Patients: only org admin or PI/CRC (critical roles)
    canManagePatients: isOrgAdmin || isCriticalRole,

    // Tasks: any trial member can manage
    canManageTasks: isOrgAdmin || isTrialMember,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get org-level permissions for a role
 */
export function getOrgPermissions(role: OrgRole | null): OrgPermissions {
  if (!role) return DEFAULT_ORG_PERMISSIONS;
  return ORG_PERMISSIONS[role] ?? DEFAULT_ORG_PERMISSIONS;
}

/**
 * Check if a role is an admin role (superadmin or admin)
 */
export function isAdminRole(role: OrgRole | null): boolean {
  return role ? ADMIN_ORG_ROLES.includes(role) : false;
}

/**
 * Check if a trial role is a critical role (PI or CRC)
 */
export function isCriticalTrialRole(role: TrialRole | null): boolean {
  return role ? CRITICAL_TRIAL_ROLES.includes(role) : false;
}

/**
 * Role hierarchy for invitation validation
 * A user can only invite users with equal or lower roles
 */
const ROLE_HIERARCHY: Record<OrgRole, number> = {
  superadmin: 4,
  admin: 3,
  editor: 2,
  reader: 1,
};

/**
 * Check if inviter can invite with target role
 */
export function canInviteWithRole(inviterRole: OrgRole, targetRole: OrgRole): boolean {
  return ROLE_HIERARCHY[inviterRole] >= ROLE_HIERARCHY[targetRole];
}

/**
 * Get roles that a user can assign when inviting
 */
export function getAssignableRoles(inviterRole: OrgRole): OrgRole[] {
  const inviterLevel = ROLE_HIERARCHY[inviterRole];
  return (Object.entries(ROLE_HIERARCHY) as [OrgRole, number][])
    .filter(([, level]) => level <= inviterLevel)
    .map(([role]) => role);
}
