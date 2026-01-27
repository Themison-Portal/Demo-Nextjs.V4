/**
 * Client - Mark Thread as Read API Route
 * POST: Mark a thread as read for current user
 */

import { createClient } from '@/lib/supabase/server'
import { withOrgMember } from '@/lib/api/middleware'

/**
 * POST /api/client/[orgId]/threads/[threadId]/read
 * Mark a thread as read for the current user
 *
 * Updates the last_read_message_id in thread_participants
 */
export const POST = withOrgMember(async (req, ctx, user) => {
  const { threadId } = ctx.params
  const supabase = await createClient()

  // Get the last message in the thread
  const { data: lastMessage, error: messageError } = await supabase
    .from('messages')
    .select('id')
    .eq('thread_id', threadId)
    .is('deleted_at', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (messageError || !lastMessage) {
    console.error('[API] Error fetching last message:', messageError)
    return Response.json(
      { error: 'Failed to find thread messages' },
      { status: 500 }
    )
  }

  // Update last_read_message_id for the current user's participant record
  const { error } = await supabase
    .from('thread_participants')
    .update({ last_read_message_id: lastMessage.id })
    .eq('thread_id', threadId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[API] Error marking thread as read:', error)
    return Response.json(
      { error: 'Failed to mark thread as read' },
      { status: 500 }
    )
  }

  return Response.json({ success: true })
})
