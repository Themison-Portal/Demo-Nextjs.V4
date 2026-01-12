/**
 * Organizations Hook
 * Connects organization service to React components
 */

import { useState, useCallback } from 'react';
import {
  getOrganizations,
  createOrganization,
  type Organization,
  type CreateOrganizationInput,
} from '@/services/organizations';

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all organizations
   */
  const fetchOrganizations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getOrganizations();
      setOrganizations(response.organizations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch organizations';
      setError(errorMessage);
      console.error('Error fetching organizations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create new organization
   */
  const create = async (input: CreateOrganizationInput): Promise<Organization | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const newOrg = await createOrganization(input);

      // Add to local state
      setOrganizations((prev) => [newOrg, ...prev]);

      return newOrg;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      setError(errorMessage);
      console.error('Error creating organization:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    organizations,
    isLoading,
    error,
    fetchOrganizations,
    createOrganization: create,
  };
}
