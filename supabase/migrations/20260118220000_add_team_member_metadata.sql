-- Add metadata fields to trial_team_members table
-- This migration adds status and settings fields to support team member management

-- Add status column with constraint
ALTER TABLE trial_team_members
  ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive'));

-- Add settings JSONB column for flexible metadata
ALTER TABLE trial_team_members
  ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;

-- Create index for status filtering
CREATE INDEX idx_trial_team_status ON trial_team_members(status);

-- Add comments for documentation
COMMENT ON COLUMN trial_team_members.status IS 'Member status: active or inactive';
COMMENT ON COLUMN trial_team_members.settings IS 'Flexible metadata: notes, contact_info, etc.';
