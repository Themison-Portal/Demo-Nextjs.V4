'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  getMessages,
  getMessage,
  createMessage,
  markMessageAsRead,
  validateTrialAccess,
} from '@/services/client/messages'
import type {
  MessageFilters,
  CreateMessageInput,
} from '@/services/messages/types'

/**
 * Hook for fetching messages with optional filters
 * @param orgId - Organization ID
 * @param filters - Optional filters (trial_id, unread_only, has_attachments)
 */
export function useMessages(orgId: string, filters?: MessageFilters) {
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['client', 'messages', orgId, filters],
    queryFn: () => getMessages(orgId, filters),
    refetchOnWindowFocus: true,
    staleTime: 10000, // 10 seconds - messages should be fresher than tasks
  })

  return {
    messages,
    isLoading,
    error,
  }
}

/**
 * Hook for fetching a single message with full details
 * @param orgId - Organization ID
 * @param messageId - Message ID
 */
export function useMessage(orgId: string, messageId: string | null) {
  const { data: message, isLoading, error } = useQuery({
    queryKey: ['client', 'messages', orgId, messageId],
    queryFn: () => getMessage(orgId, messageId!),
    enabled: !!messageId,
    refetchOnWindowFocus: true,
    staleTime: 10000,
  })

  return {
    message,
    isLoading,
    error,
  }
}

/**
 * Hook for creating a new message
 * Automatically invalidates message queries on success
 */
export function useCreateMessage(orgId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: CreateMessageInput) => createMessage(orgId, input),
    onSuccess: () => {
      // Invalidate all message queries for this org
      queryClient.invalidateQueries({
        queryKey: ['client', 'messages', orgId],
      })
    },
  })

  const create = useCallback(
    (input: CreateMessageInput) => mutation.mutateAsync(input),
    [mutation]
  )

  return {
    createMessage: create,
    isCreating: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook for marking a message as read
 * Automatically invalidates message queries on success
 */
export function useMarkMessageAsRead(orgId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (messageId: string) => markMessageAsRead(orgId, messageId),
    onSuccess: () => {
      // Invalidate all message queries for this org
      queryClient.invalidateQueries({
        queryKey: ['client', 'messages', orgId],
      })
    },
  })

  const markAsRead = useCallback(
    (messageId: string) => mutation.mutateAsync(messageId),
    [mutation]
  )

  return {
    markAsRead,
    isMarking: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook for validating if users have access to a trial
 * Used before sending messages to ensure recipients can access the trial
 */
export function useValidateTrialAccess(orgId: string, trialId: string) {
  const mutation = useMutation({
    mutationFn: (userIds: string[]) =>
      validateTrialAccess(orgId, trialId, userIds),
  })

  const validate = useCallback(
    (userIds: string[]) => mutation.mutateAsync(userIds),
    [mutation]
  )

  return {
    validate,
    isValidating: mutation.isPending,
    error: mutation.error,
  }
}
