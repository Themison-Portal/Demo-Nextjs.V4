/**
 * Organizations Hook
 *
 * NOTE: This re-exports from hooks/console/useOrganizations for backwards compatibility.
 * New code should import directly from:
 * - Console: '@/hooks/console/useOrganizations'
 * - Client: '@/hooks/client/useOrganization'
 */

'use client';

export { useOrganizations } from './console/useOrganizations';
