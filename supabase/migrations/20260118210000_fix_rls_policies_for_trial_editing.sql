-- Migration: Fix RLS policies to match permission matrix
-- Problem: trials UPDATE policy only allowed org admins
-- Solution: Allow org admins, editors assigned to trial, and PI/CRC

-- ============================================================================
-- FIX 1: trials UPDATE policy
-- ============================================================================

-- Drop old restrictive policy
DROP POLICY IF EXISTS "trials_admin_update" ON trials;

-- Create new policy matching the permission matrix:
-- canEditTrial = isOrgAdmin || (orgRole === 'editor' && isTrialMember) || isCriticalRole
CREATE POLICY "trials_update" ON trials FOR UPDATE
  USING (
    -- Org admin (superadmin/admin)
    is_org_admin(org_id)
    OR
    -- Editor assigned to trial
    (
      -- User is editor in this org
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id = trials.org_id
          AND om.org_role = 'editor'
          AND om.deleted_at IS NULL
          AND om.status = 'active'
      )
      AND
      -- User is assigned to this trial
      EXISTS (
        SELECT 1 FROM trial_team_members ttm
        JOIN organization_members om ON om.id = ttm.org_member_id
        WHERE ttm.trial_id = trials.id
          AND om.user_id = auth.uid()
          AND om.deleted_at IS NULL
      )
    )
    OR
    -- PI or CRC
    has_critical_permission(trials.id)
  )
  WITH CHECK (
    -- Same conditions for insert/update validation
    is_org_admin(org_id)
    OR has_critical_permission(trials.id)
    OR (
      EXISTS (
        SELECT 1 FROM organization_members om
        WHERE om.user_id = auth.uid()
          AND om.org_id = trials.org_id
          AND om.org_role = 'editor'
          AND om.deleted_at IS NULL
          AND om.status = 'active'
      )
      AND
      EXISTS (
        SELECT 1 FROM trial_team_members ttm
        JOIN organization_members om ON om.id = ttm.org_member_id
        WHERE ttm.trial_id = trials.id
          AND om.user_id = auth.uid()
          AND om.deleted_at IS NULL
      )
    )
  );

-- ============================================================================
-- FIX 2: trial_team_members UPDATE policy (missing)
-- ============================================================================

-- This policy was never created - needed for demoting existing PI when assigning new one
CREATE POLICY "trial_team_critical_update" ON trial_team_members FOR UPDATE
  USING (has_critical_permission(trial_id))
  WITH CHECK (has_critical_permission(trial_id));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "trials_update" ON trials IS
  'Allow UPDATE to: org admins, editors assigned to trial, or PI/CRC of trial';

COMMENT ON POLICY "trial_team_critical_update" ON trial_team_members IS
  'Allow UPDATE to: org admins, PI, or CRC (for changing team member roles)';
