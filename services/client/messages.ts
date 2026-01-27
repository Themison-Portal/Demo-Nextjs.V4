import type {
  Message,
  CreateMessageInput,
  MessageFilters,
  MessagesResponse,
} from '@/services/messages/types'

/**
 * Get messages for an organization with optional filters
 */
export async function getMessages(
  orgId: string,
  filters?: MessageFilters
): Promise<Message[]> {
  const params = new URLSearchParams()

  if (filters?.trial_id) params.append('trial_id', filters.trial_id)
  if (filters?.participant_id)
    params.append('participant_id', filters.participant_id)
  if (filters?.unread_only) params.append('unread_only', 'true')
  if (filters?.has_attachments) params.append('has_attachments', 'true')

  const queryString = params.toString()
  const url = `/api/client/${orgId}/messages${queryString ? `?${queryString}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch messages')
  }

  return response.json()
}

/**
 * Get a specific message with full details
 */
export async function getMessage(
  orgId: string,
  messageId: string
): Promise<Message> {
  const response = await fetch(`/api/client/${orgId}/messages/${messageId}`, {
    method: 'GET',
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch message')
  }

  return response.json()
}

/**
 * Create a new message (with optional attachment)
 */
export async function createMessage(
  orgId: string,
  input: CreateMessageInput
): Promise<Message> {
  const response = await fetch(`/api/client/${orgId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create message')
  }

  return response.json()
}

/**
 * Mark a message as read
 */
export async function markMessageAsRead(
  orgId: string,
  messageId: string
): Promise<void> {
  const response = await fetch(
    `/api/client/${orgId}/messages/${messageId}/read`,
    {
      method: 'POST',
      credentials: 'include',
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to mark message as read')
  }
}

/**
 * Validate if users have access to a trial
 * Used before sending messages to ensure recipients can access the trial
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
