import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, User } from '@/services/auth';

const AUTH_QUERY_KEY = ['auth', 'user'];

export function useAuth() {
    const queryClient = useQueryClient();

    // Only run query if token exists
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const {
        data: user,
        isLoading,
        error,
    } = useQuery<User | null>({
        queryKey: AUTH_QUERY_KEY,
        queryFn: () => authService.getCurrentUser(),
        enabled: !!token, // ✅ Only fetch if token exists
        staleTime: 1000 * 60 * 5,
        retry: false,
    });

    const signoutMutation = useMutation({
        mutationFn: () => authService.signout(),
        onSuccess: () => {
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