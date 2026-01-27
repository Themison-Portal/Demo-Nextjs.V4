/**
 * Threads Types
 * Types for Communication Hub with thread-based architecture
 */

import type { MessageAttachment, ResponseSnapshot } from '@/services/messages/types'

export type ParticipantType = 'to' | 'cc'

// ============================================================================
// THREAD PARTICIPANT
// ============================================================================

export interface ThreadParticipant {
  thread_id: string
  user_id: string
  participant_type: ParticipantType
  last_read_message_id: string | null
  joined_at: string

  // Relations (populated via joins)
  user?: {
    id: string
    email: string
    full_name: string | null
  }
}

// ============================================================================
// MESSAGE (within a thread)
// ============================================================================

export interface ThreadMessage {
  id: string
  thread_id: string
  sent_by: string
  content: string
  sent_at: string
  parent_message_id: string | null
  deleted_at: string | null

  // Relations (populated via joins)
  sender?: {
    id: string
    email: string
    full_name: string | null
  }
  attachments?: MessageAttachment[]
}

// ============================================================================
// THREAD
// ============================================================================

export interface MessageThread {
  id: string
  trial_id: string
  subject: string
  created_by: string
  created_at: string
  deleted_at: string | null

  // Relations (populated via joins)
  participants?: ThreadParticipant[]
  messages?: ThreadMessage[]
  creator?: {
    id: string
    email: string
    full_name: string | null
  }
  trial?: {
    id: string
    name: string
  }
}

// ============================================================================
// INPUT TYPES
// ============================================================================

/**
 * Input for creating a new thread with first message
 */
export interface CreateThreadInput {
  trial_id?: string // Optional - for general messages without trial context
  subject: string
  content: string // First message content
  to_users: string[] // user_ids
  cc_users?: string[] // user_ids

  // Optional attachment on first message
  attachment?:
    | {
        type: 'task'
        task_id: string
      }
    | {
        type: 'response'
        response_snapshot: ResponseSnapshot
      }
}

/**
 * Input for replying to a thread
 */
export interface ReplyToThreadInput {
  content: string
  parent_message_id?: string // Reply to specific message

  // Optional attachment
  attachment?:
    | {
        type: 'task'
        task_id: string
      }
    | {
        type: 'response'
        response_snapshot: ResponseSnapshot
      }
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface ThreadFilters {
  trial_id?: string
  unread_only?: boolean
}
