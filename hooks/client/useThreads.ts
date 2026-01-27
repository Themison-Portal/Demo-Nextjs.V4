'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import {
  getThreads,
  getThreadMessages,
  createThread,
  replyToThread,
  markThreadAsRead,
  validateTrialAccess,
} from '@/services/client/threads'
import type {
  ThreadFilters,
  CreateThreadInput,
  ReplyToThreadInput,
} from '@/services/threads/types'

/**
 * Hook for fetching threads with optional filters
 * @param orgId - Organization ID
 * @param filters - Optional filters (trial_id, unread_only)
 */
export function useThreads(orgId: string, filters?: ThreadFilters) {
  const { data: threads = [], isLoading, error } = useQuery({
    queryKey: ['client', 'threads', orgId, filters],
    queryFn: () => getThreads(orgId, filters),
    refetchOnWindowFocus: true,
    staleTime: 10000, // 10 seconds
  })

  return {
    threads,
    isLoading,
    error,
  }
}

/**
 * Hook for fetching messages in a specific thread
 * @param orgId - Organization ID
 * @param threadId - Thread ID
 */
export function useThreadMessages(orgId: string, threadId: string | null) {
  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ['client', 'threads', orgId, threadId, 'messages'],
    queryFn: () => getThreadMessages(orgId, threadId!),
    enabled: !!threadId,
    refetchOnWindowFocus: true,
    staleTime: 5000, // 5 seconds
  })

  return {
    messages,
    isLoading,
    error,
  }
}

/**
 * Hook for creating a new thread
 * Automatically invalidates thread queries on success
 */
export function useCreateThread(orgId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: CreateThreadInput) => createThread(orgId, input),
    onSuccess: () => {
      // Invalidate all thread queries for this org
      queryClient.invalidateQueries({
        queryKey: ['client', 'threads', orgId],
      })
    },
  })

  const create = useCallback(
    (input: CreateThreadInput) => mutation.mutateAsync(input),
    [mutation]
  )

  return {
    createThread: create,
    isCreating: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook for replying to a thread
 * Automatically invalidates thread and message queries on success
 */
export function useReplyToThread(orgId: string, threadId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (input: ReplyToThreadInput) =>
      replyToThread(orgId, threadId, input),
    onSuccess: () => {
      // Invalidate threads list and specific thread messages
      queryClient.invalidateQueries({
        queryKey: ['client', 'threads', orgId],
      })
      queryClient.invalidateQueries({
        queryKey: ['client', 'threads', orgId, threadId, 'messages'],
      })
    },
  })

  const reply = useCallback(
    (input: ReplyToThreadInput) => mutation.mutateAsync(input),
    [mutation]
  )

  return {
    replyToThread: reply,
    isReplying: mutation.isPending,
    error: mutation.error,
  }
}

/**
 * Hook for marking a thread as read
 * Automatically invalidates thread queries on success
 */
export function useMarkThreadAsRead(orgId: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (threadId: string) => markThreadAsRead(orgId, threadId),
    onSuccess: () => {
      // Invalidate all thread queries for this org
      queryClient.invalidateQueries({
        queryKey: ['client', 'threads', orgId],
      })
    },
  })

  const markAsRead = useCallback(
    (threadId: string) => mutation.mutateAsync(threadId),
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
 * Used before creating threads to ensure recipients can access the trial
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
