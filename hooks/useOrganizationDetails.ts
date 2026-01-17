/**
 * Organization Details Hook
 *
 * NOTE: This re-exports from hooks/console/useOrganizationDetails for backwards compatibility.
 * New code should import directly from:
 * - Console: '@/hooks/console/useOrganizationDetails'
 * - Client: '@/hooks/client/useOrganization'
 */

'use client';

export { useOrganizationDetails } from './console/useOrganizationDetails';
