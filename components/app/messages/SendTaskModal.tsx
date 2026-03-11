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
import { X } from 'lucide-react'
import type { TaskWithContext } from '@/services/tasks/types'

interface SendTaskModalProps {
    task: TaskWithContext
    orgId: string
    isOpen: boolean
    onClose: () => void
    onSuccess?: () => void
}

export function SendTaskModal({
    task,
    orgId,
    isOpen,
    onClose,
    onSuccess,
}: SendTaskModalProps) {
    const [toUsers, setToUsers] = useState<string[]>([])
    const [ccUsers, setCcUsers] = useState<string[]>([])
    const [message, setMessage] = useState('')
    const [error, setError] = useState<string | null>(null)

    const { user } = useAuth()

    // ✅ useTeamMembers now takes NO arguments
    const { teamMembers } = useTeamMembers()

    // task.trial_id may be undefined; provide fallback for TS
    const trialId = task.trial_id ?? ''
    const { createThread, isCreating } = useCreateThread(orgId)
    const { validate, isValidating } = useValidateTrialAccess(orgId, trialId)

    const availableMembers = teamMembers.filter((m) => m.user_id !== user?.id)

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
        return member?.full_name ?? member?.email ?? 'Unknown'
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
                    .map((u) => u.full_name ?? u.email)
                    .join(', ')
                setError(`These users don't have access to this trial: ${invalidNames}`)
                return
            }

            // Create thread with task attachment
            await createThread({
                trial_id: trialId,
                subject: `Task: ${task.title}`,
                content: message || `Please review this task`,
                to_users: toUsers,
                cc_users: ccUsers.length > 0 ? ccUsers : undefined,
                attachment: {
                    type: 'task',
                    task_id: task.id,
                },
            })

            toast.success(
                'Task sent',
                `Task sent to ${toUsers.length} recipient${toUsers.length > 1 ? 's' : ''}`
            )

            onSuccess?.()
            onClose()
        } catch (err: any) {
            setError(err.message ?? 'Failed to send task')
            toast.error('Failed to send task', err.message ?? 'An error occurred')
        }
    }

    const availableToUsers = availableMembers.filter(
        (m) => !toUsers.includes(m.user_id) && !ccUsers.includes(m.user_id)
    )
    const availableCcUsers = availableMembers.filter(
        (m) => !ccUsers.includes(m.user_id) && !toUsers.includes(m.user_id)
    )

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalHeader onClose={onClose}>Send Task</ModalHeader>

            <ModalBody>
                <div className="space-y-4">
                    {/* Task Preview */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Task
                        </p>
                        <p className="text-sm font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                        )}
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
                                            {member.full_name ?? member.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

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
                                            {member.full_name ?? member.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

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