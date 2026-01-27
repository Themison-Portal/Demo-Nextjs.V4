/**
 * Client - Mark Message as Read API Route
 * POST: Mark a message as read for current user
 */

import { createClient } from '@/lib/supabase/server'
import { withOrgMember } from '@/lib/api/middleware'

/**
 * POST /api/client/[orgId]/messages/[messageId]/read
 * Mark a message as read for the current user
 *
 * Updates the read_at timestamp in message_participants
 */
export const POST = withOrgMember(async (req, ctx, user) => {
  const { messageId } = ctx.params
  const supabase = await createClient()

  // Update read_at for the current user's participant record
  const { error } = await supabase
    .from('message_participants')
    .update({ read_at: new Date().toISOString() })
    .eq('message_id', messageId)
    .eq('user_id', user.id)
    .is('read_at', null) // Only update if not already read

  if (error) {
    console.error('[API] Error marking message as read:', error)
    return Response.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    )
  }

  return Response.json({ success: true })
})
