/**
 * useSignin Hook
 * Handles signin logic using TanStack Query and Auth0
 */

import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth';

export function useSignin() {
    return useMutation<void, Error>({
        mutationFn: () => authService.signin(),
    });
}