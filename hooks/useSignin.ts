/**
 * useSignin Hook
 * Handles signin logic using TanStack Query
 */

import { useMutation } from '@tanstack/react-query';
import { authService, SigninData, SigninResponse } from '@/services/auth';

export function useSignin() {
  return useMutation<SigninResponse, Error, SigninData>({
    mutationFn: (data: SigninData) => authService.signin(data),
  });
}
