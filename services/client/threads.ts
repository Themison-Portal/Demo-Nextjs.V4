import type {
  MessageThread,
  ThreadMessage,
  CreateThreadInput,
  ReplyToThreadInput,
  ThreadFilters,
} from '@/services/threads/types'

/**
 * Get threads for an organization with optional filters
 */
export async function getThreads(
  orgId: string,
  filters?: ThreadFilters
): Promise<MessageThread[]> {
  const params = new URLSearchParams()

  if (filters?.trial_id) params.append('trial_id', filters.trial_id)
  if (filters?.unread_only) params.append('unread_only', 'true')

  const queryString = params.toString()
  const url = `/api/client/${orgId}/threads${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch threads')
  }

  return response.json()
}

/**
 * Get messages for a specific thread
 */
export async function getThreadMessages(
  orgId: string,
  threadId: string
): Promise<ThreadMessage[]> {
  const response = await fetch(
    `/api/client/${orgId}/threads/${threadId}/messages`,
    {
      method: 'GET',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch thread messages')
  }

  return response.json()
}

/**
 * Create a new thread with first message
 */
export async function createThread(
  orgId: string,
  input: CreateThreadInput
): Promise<MessageThread> {
  const response = await fetch(`/api/client/${orgId}/threads`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create thread')
  }

  return response.json()
}

/**
 * Reply to a thread
 */
export async function replyToThread(
  orgId: string,
  threadId: string,
  input: ReplyToThreadInput
): Promise<ThreadMessage> {
  const response = await fetch(
    `/api/client/${orgId}/threads/${threadId}/messages`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to reply to thread')
  }

  return response.json()
}

/**
 * Mark a thread as read
 */
export async function markThreadAsRead(
  orgId: string,
  threadId: string
): Promise<void> {
  const response = await fetch(
    `/api/client/${orgId}/threads/${threadId}/read`,
    {
      method: 'POST',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to mark thread as read')
  }
}

/**
 * Validate if users have access to a trial
 * Used before creating threads to ensure recipients can access the trial
 */
export async function validateTrialAccess(
  orgId: string,
  trialId: string,
  userIds: string[]
): Promise<{
  valid_users: string[]
  invalid_users: Array<{ id: string; email: string; full_name: string | null }>
}> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/validate-access`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_ids: userIds }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to validate trial access')
  }

  return response.json()
}
