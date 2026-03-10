/**
 * useSignup Hook
 * Handles signup logic using TanStack Query and Auth0
 */

import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth';

export function useSignup() {
    return useMutation<void, Error>({
        mutationFn: () => authService.signin(), // Auth0 handles signup via login flow
    });
}