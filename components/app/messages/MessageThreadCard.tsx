/**
 * Message Thread Card
 * Individual thread card in the conversation list
 */

'use client'

import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Paperclip, Users, MessageCircle } from 'lucide-react'
import type { MessageThread } from '@/services/threads/types'
import { useAuth } from '@/hooks/useAuth'

interface MessageThreadCardProps {
  thread: MessageThread
  isSelected: boolean
  onSelect: (thread: MessageThread) => void
}

export function MessageThreadCard({
  thread,
  isSelected,
  onSelect,
}: MessageThreadCardProps) {
  const { user } = useAuth()

  // Filter out current user from To/CC lists (don't show yourself)
  const toParticipants =
    thread.participants?.filter(
      (p) => p.participant_type === 'to' && p.user_id !== user?.id
    ) || []
  const ccParticipants =
    thread.participants?.filter(
      (p) => p.participant_type === 'cc' && p.user_id !== user?.id
    ) || []
  const messageCount = thread.messages?.length || 0
  const lastMessage = thread.messages?.[thread.messages.length - 1]

  // Check if thread has attachments in any message
  const hasAttachment = thread.messages?.some(
    (msg) => msg.attachments && msg.attachments.length > 0
  )

  // Check if thread is unread for current user
  const currentUserParticipant = thread.participants?.find(
    (p) => p.user_id === user?.id
  )
  // Thread is unread if:
  // 1. User never read any message (last_read_message_id is NULL), OR
  // 2. Last message ID is different from last_read_message_id
  const isUnread = currentUserParticipant && (
    !currentUserParticipant.last_read_message_id ||
    (lastMessage && lastMessage.id !== currentUserParticipant.last_read_message_id)
  )

  return (
    <div
      onClick={() => onSelect(thread)}
      className={cn(
        'group flex flex-col gap-1.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
        isSelected
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50 border border-transparent'
      )}
    >
      {/* Header: Creator and Time */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          {/* Unread indicator dot */}
          {isUnread && (
            <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
          )}
          <p
            className={cn(
              'text-sm truncate',
              isUnread ? 'font-bold' : 'font-medium',
              isSelected ? 'text-gray-900' : 'text-gray-700'
            )}
          >
            {thread.creator?.full_name ||
              thread.creator?.email ||
              'Unknown'}
          </p>
        </div>
        <span className={cn(
          'text-xs flex-shrink-0',
          isUnread ? 'text-gray-600 font-semibold' : 'text-gray-400'
        )}>
          {lastMessage
            ? formatDistanceToNow(new Date(lastMessage.sent_at), {
                addSuffix: true,
              })
            : formatDistanceToNow(new Date(thread.created_at), {
                addSuffix: true,
              })}
        </span>
      </div>

      {/* Subject and Trial Badge */}
      <div className="flex items-center gap-2">
        <h4
          className={cn(
            'text-sm line-clamp-1 flex-1',
            isUnread ? 'font-bold' : 'font-medium',
            isSelected ? 'text-gray-900' : 'text-gray-800'
          )}
        >
          {thread.subject}
        </h4>
        {thread.trial && (
          <span className="shrink-0 px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
            {thread.trial.name}
          </span>
        )}
      </div>

      {/* Last Message Preview */}
      {lastMessage && (
        <p className="text-xs text-gray-500 line-clamp-2">
          {lastMessage.sent_by === user?.id
            ? 'You'
            : lastMessage.sender?.full_name || 'Someone'}
          : {lastMessage.content}
        </p>
      )}

      {/* Footer: Message Count, Participants, and Attachment Badge */}
      <div className="flex items-center justify-between gap-2 mt-1">
        {/* Left: Message Count & Participants */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            <span>{messageCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>
              To: {toParticipants.length}
              {ccParticipants.length > 0 && ` • CC: ${ccParticipants.length}`}
            </span>
          </div>
        </div>

        {/* Right: Attachment Badge */}
        {hasAttachment && (
          <div className="flex items-center gap-1 text-xs text-blue-600">
            <Paperclip className="h-3 w-3" />
          </div>
        )}
      </div>
    </div>
  )
}
