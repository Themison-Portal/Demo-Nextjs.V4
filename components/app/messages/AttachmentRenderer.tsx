/**
 * Attachment Renderer
 * Renders task or response attachments in messages
 */

'use client'

import { CheckCircle, Circle, ExternalLink, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/routes'
import { format } from 'date-fns'
import type { MessageAttachment } from '@/services/messages/types'
import Link from 'next/link'

interface AttachmentRendererProps {
  attachment: MessageAttachment
  orgId: string
}

export function AttachmentRenderer({
  attachment,
  orgId,
}: AttachmentRendererProps) {
  // Task Attachment
  if (attachment.attachment_type === 'task' && attachment.task) {
    const task = attachment.task
    const statusIcon =
      task.status === 'completed' ? (
        <CheckCircle className="h-4 w-4 text-green-600" />
      ) : (
        <Circle className="h-4 w-4 text-gray-400" />
      )

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-2 flex-1">
            {statusIcon}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                {task.title}
              </h4>
              <p className="text-xs text-gray-500 mt-0.5">
                Status: {task.status.replace('_', ' ')}
              </p>
            </div>
          </div>
          <Link
            href={`${ROUTES.APP.TASKS(orgId)}?taskId=${task.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm" className="h-8 gap-1">
              <ExternalLink className="h-3 w-3" />
              <span className="text-xs">View Task</span>
            </Button>
          </Link>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-gray-600 line-clamp-3 mb-3">
            {task.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          {task.assigned_to && (
            <span>Assigned to: {task.assigned_to.slice(0, 8)}...</span>
          )}
          {task.due_date && (
            <span>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
          )}
        </div>
      </div>
    )
  }

  // Response Attachment
  if (
    attachment.attachment_type === 'response' &&
    attachment.response_snapshot
  ) {
    const snapshot = attachment.response_snapshot
    const question = snapshot.question?.text || 'No question'
    const answer = snapshot.answer?.text || 'No answer'

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        {/* Header */}
        <div className="flex items-start gap-2 mb-3">
          <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
              Document Assistant Response
            </h4>
          </div>
        </div>

        {/* Question */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-700 mb-1">Question:</p>
          <p className="text-sm text-gray-900 bg-gray-50 rounded p-2">
            {question}
          </p>
        </div>

        {/* Answer */}
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">Answer:</p>
          <div className="text-sm text-gray-900 bg-blue-50 rounded p-3 border border-blue-100">
            <p className="whitespace-pre-wrap">{answer}</p>
          </div>
        </div>

        {/* Timestamp */}
        {snapshot.question?.timestamp && (
          <p className="text-xs text-gray-400 mt-3">
            Generated:{' '}
            {format(new Date(snapshot.question.timestamp), 'PPpp')}
          </p>
        )}
      </div>
    )
  }

  // Fallback for unknown attachment type
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <p className="text-sm text-gray-500">
        Attachment type not supported or data unavailable
      </p>
    </div>
  )
}
