/**
 * useValidateInvitation Hook
 * Validates invitation token using TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { authService, ValidateInvitationResponse } from '@/services/auth';

export function useValidateInvitation(token: string | null) {
  return useQuery<ValidateInvitationResponse>({
    queryKey: ['invitation', 'validate', token],
    queryFn: () => {
      if (!token) {
        throw new Error('Token is required');
      }
      return authService.validateInvitation(token);
    },
    enabled: !!token, // Only run query if token exists
    retry: false, // Don't retry on error (invalid tokens shouldn't retry)
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
