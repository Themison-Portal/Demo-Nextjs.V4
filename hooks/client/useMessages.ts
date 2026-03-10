'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { apiClient } from '@/lib/apiClient'
import type { CreateMessageInput } from '@/services/messages/types'

/**
 * Hook for fetching messages for a chat session
 */
export function useMessages(sessionId: string) {
    const { data: messages = [], isLoading, error } = useQuery({
        queryKey: ['messages', sessionId],
        queryFn: () => apiClient.getMessages(sessionId),
        enabled: !!sessionId,
        refetchOnWindowFocus: true,
        staleTime: 10000,
    })

    return {
        messages,
        isLoading,
        error,
    }
}

/**
 * Hook for creating a message
 */
export function useCreateMessage(sessionId: string) {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (content: string) =>
            apiClient.createMessage({
                session_id: sessionId,
                content,
            }),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['messages', sessionId],
            })
        },
    })

    const create = useCallback(
        (content: string) => mutation.mutateAsync(content),
        [mutation]
    )

    return {
        createMessage: create,
        isCreating: mutation.isPending,
        error: mutation.error,
    }
}

/**
 * Hook for updating a message
 */
export function useUpdateMessage(sessionId: string) {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: ({
            messageId,
            content,
        }: {
            messageId: string
            content: string
        }) => apiClient.updateMessage(messageId, content),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['messages', sessionId],
            })
        },
    })

    return {
        updateMessage: mutation.mutateAsync,
        isUpdating: mutation.isPending,
        error: mutation.error,
    }
}

/**
 * Hook for deleting a message
 */
export function useDeleteMessage(sessionId: string) {
    const queryClient = useQueryClient()

    const mutation = useMutation({
        mutationFn: (messageId: string) =>
            apiClient.deleteMessage(messageId),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['messages', sessionId],
            })
        },
    })

    return {
        deleteMessage: mutation.mutateAsync,
        isDeleting: mutation.isPending,
        error: mutation.error,
    }
}