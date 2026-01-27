/**
 * Client - Validate Trial Access API Route
 * POST: Validate if users have access to a trial
 */

import { createClient } from '@/lib/supabase/server'
import { withOrgMember } from '@/lib/api/middleware'
import { validateTrialAccess } from '@/lib/api/helpers/validateTrialAccess'

/**
 * POST /api/client/[orgId]/trials/[trialId]/validate-access
 * Validate if a list of users have access to a trial
 *
 * Body:
 * - user_ids: Array of user IDs to validate
 *
 * Returns:
 * - valid_users: Array of user IDs with access
 * - invalid_users: Array of user objects without access
 *
 * Access logic:
 * - Staff with support enabled: Always has access
 * - Org admin (superadmin/admin): Always has access to all trials
 * - Trial team members: Have access to specific trial
 */
export const POST = withOrgMember(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params
  const supabase = await createClient()

  // Parse request body
  let body: { user_ids: string[] }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { user_ids } = body

  if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
    return Response.json(
      { error: 'user_ids array is required' },
      { status: 400 }
    )
  }

  // Verify trial exists and belongs to org
  const { data: trial, error: trialError } = await supabase
    .from('trials')
    .select('id')
    .eq('id', trialId)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .single()

  if (trialError || !trial) {
    return Response.json({ error: 'Trial not found' }, { status: 404 })
  }

  // Validate using shared helper
  try {
    const result = await validateTrialAccess(supabase, orgId, trialId, user_ids)
    return Response.json(result)
  } catch (error: any) {
    console.error('[API] Error validating trial access:', error)
    return Response.json(
      { error: error.message || 'Failed to validate trial access' },
      { status: 500 }
    )
  }
})
