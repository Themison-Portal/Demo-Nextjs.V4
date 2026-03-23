import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { authService, User } from '@/services/auth';

const AUTH_QUERY_KEY = ['auth', 'user'];

export function useAuth() {
    const queryClient = useQueryClient();

    // Use state so the component re-renders when token appears
    const [token, setToken] = useState<string | null>(
        typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
    );


    useEffect(() => {
        const stored = localStorage.getItem('access_token');
        if (stored !== token) setToken(stored);

        const handleStorage = () => {
            const updated = localStorage.getItem('access_token');
            setToken(updated);
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const {
        data: user,
        isLoading,
        error,
    } = useQuery<User | null>({
        queryKey: AUTH_QUERY_KEY,
        queryFn: () => authService.getCurrentUser(),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
        retry: false,
    });

    const signoutMutation = useMutation({
        mutationFn: () => authService.signout(),
        onSuccess: () => {
            localStorage.removeItem('access_token');

            document.cookie = 'access_token=; path=/; max-age=0';
            queryClient.setQueryData(AUTH_QUERY_KEY, null);
            setToken(null);
        },
    });

    return {
        user,
        isLoading: isLoading && !!token,
        isAuthenticated: !!user,
        error,
        signout: signoutMutation.mutateAsync,
        isSigningOut: signoutMutation.isPending,
    };
}