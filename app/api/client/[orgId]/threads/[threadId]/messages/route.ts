/**
 * Client - Thread Messages API Route
 * GET: Get messages in a thread
 * POST: Reply to a thread
 */

import { createClient } from '@/lib/supabase/server'
import { withOrgMember } from '@/lib/api/middleware'

/**
 * GET /api/client/[orgId]/threads/[threadId]/messages
 * Get all messages in a thread
 *
 * Access:
 * - Users can only see messages from threads they're participants in (via RLS)
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  const { threadId } = ctx.params
  const supabase = await createClient()

  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sent_by_fkey(id, email, full_name),
      attachments:message_attachments(
        id,
        attachment_type,
        task_id,
        response_snapshot,
        task:tasks(id, title, status, assigned_to, description, due_date)
      )
    `)
    .eq('thread_id', threadId)
    .is('deleted_at', null)
    .order('sent_at', { ascending: true })

  if (error) {
    console.error('[API] Error fetching messages:', error)
    return Response.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }

  return Response.json(messages)
})

/**
 * POST /api/client/[orgId]/threads/[threadId]/messages
 * Reply to a thread
 *
 * Body:
 * - content: Message content
 * - parent_message_id: Optional, reply to specific message
 * - attachment: Optional { type: 'task', task_id } or { type: 'response', response_snapshot }
 */
export const POST = withOrgMember(async (req, ctx, user) => {
  const { threadId } = ctx.params
  const supabase = await createClient()

  // Parse request body
  let input: any
  try {
    input = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { content, parent_message_id, attachment } = input

  // Validate required fields
  if (!content) {
    return Response.json({ error: 'content is required' }, { status: 400 })
  }

  // Verify thread exists and user is a participant (RLS will enforce this)
  const { data: thread, error: threadError } = await supabase
    .from('message_threads')
    .select('id')
    .eq('id', threadId)
    .is('deleted_at', null)
    .single()

  if (threadError || !thread) {
    return Response.json({ error: 'Thread not found or no access' }, { status: 404 })
  }

  // Step 1: Create message
  const { data: message, error: messageError } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      sent_by: user.id,
      content: content.trim(),
      parent_message_id: parent_message_id || null,
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

  // Step 2: Create attachment if provided
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

  // Step 3: Update sender's last_read_message_id to this new message
  // No need to touch other participants - they'll see it as unread automatically
  // because their last_read_message_id won't match the new message ID
  await supabase
    .from('thread_participants')
    .update({ last_read_message_id: message.id })
    .eq('thread_id', threadId)
    .eq('user_id', user.id)

  // Step 4: Fetch complete message with relations
  const { data: completeMessage } = await supabase
    .from('messages')
    .select(`
      *,
      sender:users!messages_sent_by_fkey(id, email, full_name),
      attachments:message_attachments(
        id,
        attachment_type,
        task_id,
        response_snapshot,
        task:tasks(id, title, status, assigned_to, description, due_date)
      )
    `)
    .eq('id', message.id)
    .single()

  return Response.json(completeMessage, { status: 201 })
})
