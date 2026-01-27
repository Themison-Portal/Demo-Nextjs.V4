/**
 * Messages Types
 * Types for Communication Hub messages and attachments
 */

export type MessageAttachmentType = 'task' | 'response'
export type ParticipantType = 'to' | 'cc'

// ============================================================================
// RESPONSE SNAPSHOT
// ============================================================================

/**
 * Snapshot of a Document Assistant response
 * Mirrors the structure of responses_archived.raw_data
 */
export interface ResponseSnapshot {
  answer: {
    text: string
  }
  question: {
    text: string
    timestamp: string
  }
  // Extensible for future RAG enhancements (citations, metadata, etc)
  [key: string]: unknown
}

// ============================================================================
// MESSAGE ATTACHMENT
// ============================================================================

export interface MessageAttachment {
  id: string
  message_id: string
  attachment_type: MessageAttachmentType
  task_id: string | null
  response_snapshot: ResponseSnapshot | null
  created_at: string

  // Relations (populated via joins)
  task?: {
    id: string
    title: string
    status: string
    assigned_to?: string | null
    description?: string | null
    due_date?: string | null
  } | null
}

// ============================================================================
// MESSAGE PARTICIPANT
// ============================================================================

export interface MessageParticipant {
  id: string
  message_id: string
  user_id: string
  participant_type: ParticipantType
  read_at: string | null

  // Relations (populated via joins)
  user?: {
    id: string
    email: string
    full_name: string | null
  }
}

// ============================================================================
// MESSAGE
// ============================================================================

export interface Message {
  id: string
  trial_id: string
  subject: string
  body: string
  parent_message_id: string | null
  sent_by: string
  sent_at: string
  deleted_at: string | null

  // Relations (populated via joins)
  participants?: MessageParticipant[]
  attachments?: MessageAttachment[]
  sender?: {
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
 * Input for creating a new message
 */
export interface CreateMessageInput {
  trial_id: string
  subject: string
  body: string
  to: string[] // user_ids
  cc?: string[] // user_ids
  parent_message_id?: string

  // Optional attachment (task OR response, not both)
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
 * Input for replying to a message
 */
export interface ReplyToMessageInput {
  parent_message_id: string
  body: string
  // Inherit trial_id, subject, and participants from parent
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface MessagesResponse {
  messages: Message[]
  total: number
}

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface MessageFilters {
  trial_id?: string
  participant_id?: string // Filter by specific participant
  unread_only?: boolean
  has_attachments?: boolean
}
