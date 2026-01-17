-- Migration: Change trial_team_members to reference organization_members.id
-- Instead of referencing users.id directly, reference the membership record
-- This ensures trial access is tied to org membership, not just user existence

-- ============================================================================
-- STEP 0: Drop triggers and functions that depend on user_id
-- ============================================================================

-- Drop the trigger that resolves pending assignments (uses user_id)
DROP TRIGGER IF EXISTS on_invitation_accepted_resolve_trial_team ON invitations;

-- Drop the function (will be recreated with new logic)
DROP FUNCTION IF EXISTS resolve_trial_team_pending_assignments();

-- Drop the constraint that references user_id
ALTER TABLE trial_team_members
  DROP CONSTRAINT IF EXISTS trial_team_member_assignment_check;

-- ============================================================================
-- STEP 1: Drop RLS policies that depend on trial_team_members.user_id
-- ============================================================================

-- Drop the trials_team_view policy that uses user_id
DROP POLICY IF EXISTS "trials_team_view" ON trials;

-- ============================================================================
-- STEP 2: Drop indexes that depend on user_id
-- ============================================================================

-- Drop partial unique index from migration 20260116132827
DROP INDEX IF EXISTS trial_team_members_trial_user_unique;

-- Drop the old index on user_id
DROP INDEX IF EXISTS idx_trial_team_user_id;

-- ============================================================================
-- STEP 3: Add org_member_id column
-- ============================================================================

ALTER TABLE trial_team_members
  ADD COLUMN org_member_id UUID;

-- ============================================================================
-- STEP 4: Populate org_member_id for existing rows
-- ============================================================================

-- For each trial_team_member, find the corresponding organization_member
-- by matching user_id and the org_id from the trial
UPDATE trial_team_members ttm
SET org_member_id = om.id
FROM organization_members om
JOIN trials t ON t.org_id = om.org_id
WHERE ttm.trial_id = t.id
  AND ttm.user_id = om.user_id
  AND om.deleted_at IS NULL;

-- ============================================================================
-- STEP 5: Add foreign key constraint
-- ============================================================================

-- Make org_member_id NOT NULL (all existing rows should be populated now)
-- Note: If there are orphaned trial_team_members (user not in org), they need cleanup first
ALTER TABLE trial_team_members
  ALTER COLUMN org_member_id SET NOT NULL;

-- Add FK to organization_members with CASCADE delete
-- When org_member is deleted, trial_team_member is also deleted
ALTER TABLE trial_team_members
  ADD CONSTRAINT trial_team_members_org_member_id_fkey
    FOREIGN KEY (org_member_id) REFERENCES organization_members(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 6: Drop old columns and constraints
-- ============================================================================

-- Drop the old FK constraint first
ALTER TABLE trial_team_members
  DROP CONSTRAINT IF EXISTS trial_team_members_user_id_fkey;

-- Drop old unique constraint if exists (was on trial_id, user_id)
ALTER TABLE trial_team_members
  DROP CONSTRAINT IF EXISTS trial_team_members_trial_id_user_id_key;

-- Drop the user_id column (no longer needed)
ALTER TABLE trial_team_members
  DROP COLUMN user_id;

-- Drop pending_invitation_id related objects (simplifying for now)
-- This functionality can be re-added later with proper org_member_id support
DROP INDEX IF EXISTS trial_team_members_trial_invitation_unique;
DROP INDEX IF EXISTS idx_trial_team_pending_invitation;
ALTER TABLE trial_team_members
  DROP COLUMN IF EXISTS pending_invitation_id;

-- ============================================================================
-- STEP 7: Add new constraints and indexes
-- ============================================================================

-- Add new unique constraint (trial_id, org_member_id)
ALTER TABLE trial_team_members
  ADD CONSTRAINT trial_team_members_trial_org_member_unique
    UNIQUE (trial_id, org_member_id);

-- Create new index for org_member_id lookups
CREATE INDEX idx_trial_team_org_member_id ON trial_team_members(org_member_id);

-- ============================================================================
-- STEP 8: Recreate RLS policy with new schema
-- ============================================================================

-- Recreate trials_team_view policy using org_member_id
-- Now checks that user is in trial_team via their organization membership
CREATE POLICY "trials_team_view" ON trials FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM trial_team_members ttm
      JOIN organization_members om ON om.id = ttm.org_member_id
      WHERE ttm.trial_id = trials.id
        AND om.user_id = auth.uid()
        AND om.deleted_at IS NULL
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN trial_team_members.org_member_id IS 'Reference to organization_members.id. Ties trial access to org membership.';
