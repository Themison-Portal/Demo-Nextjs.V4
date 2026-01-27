/**
 * Client - Messages API Route
 * GET: Get messages for organization with filtering
 * POST: Create new message (with optional attachment)
 */

import { createClient } from '@/lib/supabase/server'
import { withOrgMember } from '@/lib/api/middleware'
import type { CreateMessageInput } from '@/services/messages/types'

/**
 * GET /api/client/[orgId]/messages
 * Get messages where user is a participant
 *
 * Query params:
 * - trial_id: Filter by trial
 * - unread_only: Filter unread messages
 * - has_attachments: Filter messages with attachments
 *
 * Access:
 * - Users see only messages where they are sender or participant (to/cc)
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params
  const supabase = await createClient()

  // Parse query params
  const url = new URL(req.url)
  const trialIdFilter = url.searchParams.get('trial_id')
  const unreadOnly = url.searchParams.get('unread_only') === 'true'

  // Build select query for message details
  const selectQuery = `
    *,
    participants:message_participants(
      id,
      user_id,
      participant_type,
      read_at,
      user:users(id, email, full_name)
    ),
    attachments:message_attachments(
      id,
      attachment_type,
      task_id,
      response_snapshot,
      task:tasks(id, title, status, assigned_to, description, due_date)
    ),
    sender:users!messages_sent_by_fkey(id, email, full_name),
    trial:trials!inner(id, name)
  `

  // Query 1: Messages sent by user
  let sentQuery = supabase
    .from('messages')
    .select(selectQuery)
    .is('deleted_at', null)
    .eq('sent_by', user.id)

  if (trialIdFilter) {
    sentQuery = sentQuery.eq('trial_id', trialIdFilter)
  }

  // Query 2: Messages where user is a participant
  // Get message IDs where user is participant
  let participantQuery = supabase
    .from('message_participants')
    .select('message_id')
    .eq('user_id', user.id)

  const { data: participantData } = await participantQuery
  const participantMessageIds = (participantData || []).map((p) => p.message_id)

  let receivedQuery = supabase
    .from('messages')
    .select(selectQuery)
    .is('deleted_at', null)
    .in('id', participantMessageIds.length > 0 ? participantMessageIds : ['00000000-0000-0000-0000-000000000000']) // Dummy UUID if no participants

  if (trialIdFilter) {
    receivedQuery = receivedQuery.eq('trial_id', trialIdFilter)
  }

  // Execute both queries
  const [sentResult, receivedResult] = await Promise.all([
    sentQuery,
    receivedQuery,
  ])

  if (sentResult.error) {
    console.error('[API] Error fetching sent messages:', sentResult.error)
    return Response.json(
      { error: 'Failed to fetch sent messages' },
      { status: 500 }
    )
  }

  if (receivedResult.error) {
    console.error('[API] Error fetching received messages:', receivedResult.error)
    return Response.json(
      { error: 'Failed to fetch received messages' },
      { status: 500 }
    )
  }

  // Combine and deduplicate messages (user might be both sender and participant)
  const messageMap = new Map()

  ;[...(sentResult.data || []), ...(receivedResult.data || [])].forEach((msg: any) => {
    messageMap.set(msg.id, msg)
  })

  const messages = Array.from(messageMap.values()).sort(
    (a: any, b: any) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
  )

  // Filter unread messages if requested
  let filteredMessages = messages
  if (unreadOnly) {
    filteredMessages = filteredMessages.filter((msg: any) => {
      // Message is unread if user is a participant and hasn't read it
      const userParticipant = msg.participants?.find(
        (p: any) => p.user_id === user.id
      )
      return userParticipant && !userParticipant.read_at
    })
  }

  return Response.json(filteredMessages)
})

/**
 * POST /api/client/[orgId]/messages
 * Create a new message with optional attachment
 *
 * Body:
 * - trial_id: Trial context
 * - subject: Message subject
 * - body: Message content
 * - to: Array of user_ids (recipients)
 * - cc: Array of user_ids (optional, copied users)
 * - parent_message_id: Optional, for replies
 * - attachment: Optional { type: 'task', task_id } or { type: 'response', response_snapshot }
 */
export const POST = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params
  const supabase = await createClient()

  // Parse request body
  let input: CreateMessageInput
  try {
    input = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { trial_id, subject, body, to, cc, parent_message_id, attachment } =
    input

  // Validate required fields
  if (!trial_id || !subject || !body || !to || to.length === 0) {
    return Response.json(
      { error: 'trial_id, subject, body, and to (recipients) are required' },
      { status: 400 }
    )
  }

  // Verify trial exists and belongs to org
  const { data: trial, error: trialError } = await supabase
    .from('trials')
    .select('id')
    .eq('id', trial_id)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .single()

  if (trialError || !trial) {
    return Response.json({ error: 'Trial not found' }, { status: 404 })
  }

  // Verify user has access to trial (RLS will enforce this too, but good to check)
  // This is handled by RLS policies on messages table

  // Step 1: Create message
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      trial_id,
      subject: subject.trim(),
      body: body.trim(),
      parent_message_id: parent_message_id || null,
      sent_by: user.id,
    })
    .select()
    .single()

  if (messageError) {
    console.error('[API] Error creating message:', messageError)
    return Response.json(
      { error: 'Failed to create message' },
      { status: 500 }
    )
  }

  // Step 2: Create participants
  const participants = [
    ...to.map((userId) => ({
      message_id: message.id,
      user_id: userId,
      participant_type: 'to' as const,
    })),
    ...(cc || []).map((userId) => ({
      message_id: message.id,
      user_id: userId,
      participant_type: 'cc' as const,
    })),
  ]

  const { error: participantsError } = await supabase
    .from('message_participants')
    .insert(participants)

  if (participantsError) {
    console.error('[API] Error creating participants:', participantsError)
    // Rollback message (soft delete)
    await supabase
      .from('messages')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', message.id)

    return Response.json(
      { error: 'Failed to create message participants' },
      { status: 500 }
    )
  }

  // Step 3: Create attachment if provided
  if (attachment) {
    const attachmentData =
      attachment.type === 'task'
        ? {
            message_id: message.id,
            attachment_type: 'task' as const,
            task_id: attachment.task_id,
            response_snapshot: null,
          }
        : {
            message_id: message.id,
            attachment_type: 'response' as const,
            task_id: null,
            response_snapshot: attachment.response_snapshot,
          }

    const { error: attachmentError } = await supabase
      .from('message_attachments')
      .insert(attachmentData)

    if (attachmentError) {
      console.error('[API] Error creating attachment:', attachmentError)
      // Rollback message (soft delete)
      await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', message.id)

      return Response.json(
        { error: 'Failed to create message attachment' },
        { status: 500 }
      )
    }
  }

  // Step 4: Fetch complete message with relations
  const { data: completeMessage } = await supabase
    .from('messages')
    .select(
      `
      *,
      participants:message_participants(
        id,
        user_id,
        participant_type,
        read_at,
        user:users(id, email, full_name)
      ),
      attachments:message_attachments(
        id,
        attachment_type,
        task_id,
        response_snapshot,
        task:tasks(id, title, status, assigned_to, description, due_date)
      ),
      sender:users!messages_sent_by_fkey(id, email, full_name),
      trial:trials!inner(id, name)
    `
    )
    .eq('id', message.id)
    .single()

  return Response.json(completeMessage, { status: 201 })
})
