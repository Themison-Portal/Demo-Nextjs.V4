/**
 * Organization Service Exports
 *
 * NOTE: This re-exports from services/console/organizations for backwards compatibility.
 * New code should import directly from:
 * - Console: '@/services/console/organizations'
 * - Client: '@/services/client/organizations'
 */

export * from './types';

// Re-export console services for backwards compatibility
export {
  getOrganizations,
  createOrganization,
  getOrganizationById,
  updateOrganization,
  inviteMemberToOrganization,
  removeOrganizationMember,
} from '../console/organizations';
