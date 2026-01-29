/**
 * Send Response Modal
 * Modal for sending a Document Assistant response as a message attachment
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTeamMembers } from '@/hooks/client/useTeamMembers'
import { useCreateThread, useValidateTrialAccess } from '@/hooks/client/useThreads'
import { useAuth } from '@/hooks/useAuth'
import { toast } from '@/lib/toast'
import { X, FileText } from 'lucide-react'
import type { ResponseSnapshot } from '@/services/messages/types'

interface SendResponseModalProps {
  orgId: string
  trialId: string
  responseSnapshot: ResponseSnapshot
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function SendResponseModal({
  orgId,
  trialId,
  responseSnapshot,
  isOpen,
  onClose,
  onSuccess,
}: SendResponseModalProps) {
  const [toUsers, setToUsers] = useState<string[]>([])
  const [ccUsers, setCcUsers] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const { teamMembers } = useTeamMembers(orgId, trialId)
  const { createThread, isCreating } = useCreateThread(orgId)
  const { validate, isValidating } = useValidateTrialAccess(orgId, trialId)

  // Filter out current user from team members
  const availableMembers = teamMembers.filter((m) => m.user_id !== user?.id)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setToUsers([])
      setCcUsers([])
      setMessage('')
      setError(null)
    }
  }, [isOpen])

  const handleAddToUser = (userId: string) => {
    if (userId && !toUsers.includes(userId) && !ccUsers.includes(userId)) {
      setToUsers([...toUsers, userId])
    }
  }

  const handleAddCcUser = (userId: string) => {
    if (userId && !ccUsers.includes(userId) && !toUsers.includes(userId)) {
      setCcUsers([...ccUsers, userId])
    }
  }

  const handleRemoveToUser = (userId: string) => {
    setToUsers(toUsers.filter((id) => id !== userId))
  }

  const handleRemoveCcUser = (userId: string) => {
    setCcUsers(ccUsers.filter((id) => id !== userId))
  }

  const getUserName = (userId: string) => {
    const member = teamMembers.find((m) => m.user_id === userId)
    return member?.full_name || member?.email || 'Unknown'
  }

  const handleSend = async () => {
    setError(null)

    if (toUsers.length === 0) {
      setError('Please select at least one recipient')
      return
    }

    try {
      // Validate trial access for all recipients
      const allUsers = [...toUsers, ...ccUsers]
      const validation = await validate(allUsers)

      if (validation.invalid_users.length > 0) {
        const invalidNames = validation.invalid_users
          .map((u) => u.full_name || u.email)
          .join(', ')
        setError(
          `These users don't have access to this trial: ${invalidNames}`
        )
        return
      }

      // Create thread with response attachment
      const questionPreview = responseSnapshot.question.text.slice(0, 50)
      await createThread({
        trial_id: trialId,
        subject: `Document Assistant: ${questionPreview}${responseSnapshot.question.text.length > 50 ? '...' : ''}`,
        content: message || 'Please review this response from the Document Assistant',
        to_users: toUsers,
        cc_users: ccUsers.length > 0 ? ccUsers : undefined,
        attachment: {
          type: 'response',
          response_snapshot: responseSnapshot,
        },
      })

      toast.success(
        "Response sent",
        `Response sent to ${toUsers.length} recipient${toUsers.length > 1 ? 's' : ''}`
      )

      onSuccess?.()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to send response')
      toast.error(
        "Failed to send response",
        err.message || 'An error occurred'
      )
    }
  }

  const availableToUsers = availableMembers.filter(
    (m) => !toUsers.includes(m.user_id) && !ccUsers.includes(m.user_id)
  )
  const availableCcUsers = availableMembers.filter(
    (m) => !ccUsers.includes(m.user_id) && !toUsers.includes(m.user_id)
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalHeader onClose={onClose}>Send Response</ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          {/* Response Preview */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Document Assistant Response
              </p>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Question:
                </p>
                <p className="text-sm text-gray-900 line-clamp-2">
                  {responseSnapshot.question.text}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">
                  Answer:
                </p>
                <p className="text-sm text-gray-900 line-clamp-3">
                  {responseSnapshot.answer.text}
                </p>
              </div>
            </div>
          </div>

          {/* To Recipients */}
          <div>
            <Label className="mb-2">To *</Label>
            <div className="space-y-2">
              <Select onValueChange={handleAddToUser} value="">
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {availableToUsers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected To Users */}
              {toUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {toUsers.map((userId) => (
                    <div
                      key={userId}
                      className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      <span>{getUserName(userId)}</span>
                      <button
                        onClick={() => handleRemoveToUser(userId)}
                        className="hover:text-blue-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CC Recipients */}
          <div>
            <Label className="mb-2">CC (optional)</Label>
            <div className="space-y-2">
              <Select onValueChange={handleAddCcUser} value="">
                <SelectTrigger>
                  <SelectValue placeholder="Select CC recipient" />
                </SelectTrigger>
                <SelectContent>
                  {availableCcUsers.map((member) => (
                    <SelectItem key={member.user_id} value={member.user_id}>
                      {member.full_name || member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected CC Users */}
              {ccUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {ccUsers.map((userId) => (
                    <div
                      key={userId}
                      className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      <span>{getUserName(userId)}</span>
                      <button
                        onClick={() => handleRemoveCcUser(userId)}
                        className="hover:text-gray-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <Label className="mb-2">Message (optional)</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a message..."
              rows={4}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              {error}
            </div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="outline" onClick={onClose} disabled={isCreating}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          disabled={toUsers.length === 0 || isCreating || isValidating}
        >
          {isCreating ? 'Sending...' : isValidating ? 'Validating...' : 'Send'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
