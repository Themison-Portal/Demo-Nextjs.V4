-- Migration: Add ID and user_snapshot to organization_members
-- This enables:
-- 1. Other tables to reference a specific membership (trial_team_members)
-- 2. Soft delete with user data preserved when user is hard deleted from auth
-- 3. Clean re-invitation flow (new user = new ID, zero connection to past)

-- ============================================================================
-- STEP 1: Add new columns
-- ============================================================================

-- Add id column (will become the new PK)
ALTER TABLE organization_members
  ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Populate id for existing rows
UPDATE organization_members SET id = gen_random_uuid() WHERE id IS NULL;

-- Add user_snapshot column (stores user data when user is deleted)
ALTER TABLE organization_members
  ADD COLUMN user_snapshot JSONB DEFAULT NULL;

-- ============================================================================
-- STEP 2: Change primary key from (user_id, org_id) to id
-- ============================================================================

-- Drop the old primary key
ALTER TABLE organization_members
  DROP CONSTRAINT organization_members_pkey;

-- Make id NOT NULL and set as new primary key
ALTER TABLE organization_members
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE organization_members
  ADD PRIMARY KEY (id);

-- Add unique constraint on (user_id, org_id) for active members
-- This prevents duplicate active memberships
CREATE UNIQUE INDEX idx_organization_members_user_org_unique
  ON organization_members (user_id, org_id)
  WHERE deleted_at IS NULL AND user_id IS NOT NULL;

-- ============================================================================
-- STEP 3: Change user_id FK from CASCADE to SET NULL
-- ============================================================================

-- Drop the old foreign key constraint
ALTER TABLE organization_members
  DROP CONSTRAINT organization_members_user_id_fkey;

-- Make user_id nullable (will be NULL when user is hard deleted)
ALTER TABLE organization_members
  ALTER COLUMN user_id DROP NOT NULL;

-- Add new foreign key with ON DELETE SET NULL
ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- STEP 4: Create index on new id column for lookups
-- ============================================================================

-- Index for org_member_id lookups (will be used by trial_team_members)
CREATE INDEX idx_organization_members_id ON organization_members(id);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN organization_members.id IS 'Unique identifier for this membership record';
COMMENT ON COLUMN organization_members.user_snapshot IS 'Snapshot of user data (email, name) preserved when user is hard deleted';
COMMENT ON COLUMN organization_members.user_id IS 'Reference to users table. NULL when user has been deleted from the system.';
