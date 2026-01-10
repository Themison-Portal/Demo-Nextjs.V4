/**
 * useAuth Hook
 * General authentication hook that provides current user state
 * Uses TanStack Query for caching and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, User } from '@/services/auth';

const AUTH_QUERY_KEY = ['auth', 'user'];

export function useAuth() {
  const queryClient = useQueryClient();

  // Query current user
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => authService.getCurrentUser(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Signout mutation
  const signoutMutation = useMutation({
    mutationFn: () => authService.signout(),
    onSuccess: () => {
      // Clear user from cache
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    signout: signoutMutation.mutateAsync,
    isSigningOut: signoutMutation.isPending,
  };
}
