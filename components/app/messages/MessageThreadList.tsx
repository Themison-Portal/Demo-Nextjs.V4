/**
 * Message Thread List
 * Middle column showing conversation threads
 */

'use client'

import { MessageThreadCard } from './MessageThreadCard'
import { Mail, Loader2 } from 'lucide-react'
import type { MessageThread } from '@/services/threads/types'

interface MessageThreadListProps {
  orgId: string
  threads: MessageThread[]
  selectedThreadId: string | null
  onSelectThread: (thread: MessageThread) => void
}

export function MessageThreadList({
  orgId,
  threads,
  selectedThreadId,
  onSelectThread,
}: MessageThreadListProps) {
  // Empty state
  if (threads.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 space-y-2 px-4">
          <Mail className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs text-gray-400">
            Send a task or response to start a conversation
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-200 h-12 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Conversations ({threads.length})
        </h3>
      </div>

      {/* Threads List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1">
          {threads.map((thread) => (
            <MessageThreadCard
              key={thread.id}
              thread={thread}
              isSelected={selectedThreadId === thread.id}
              onSelect={onSelectThread}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
