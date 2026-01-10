/**
 * useSignup Hook
 * Handles signup logic using TanStack Query
 */

import { useMutation } from '@tanstack/react-query';
import { authService, SignupData, SignupResponse } from '@/services/auth';

export function useSignup() {
  return useMutation<SignupResponse, Error, SignupData>({
    mutationFn: (data: SignupData) => authService.signup(data),
  });
}
