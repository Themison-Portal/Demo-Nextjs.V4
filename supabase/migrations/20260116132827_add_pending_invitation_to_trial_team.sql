-- Add pending_invitation_id to trial_team_members
-- Allows assigning invited (not yet accepted) users to trials

-- Step 1: Add pending_invitation_id column
ALTER TABLE trial_team_members
ADD COLUMN pending_invitation_id UUID REFERENCES invitations(id) ON DELETE SET NULL;

-- Step 2: Make user_id nullable (can be null when pending_invitation_id is set)
ALTER TABLE trial_team_members
ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: Add constraint ensuring either user_id OR pending_invitation_id is set
ALTER TABLE trial_team_members
ADD CONSTRAINT trial_team_member_assignment_check
CHECK (
  (user_id IS NOT NULL AND pending_invitation_id IS NULL) OR
  (user_id IS NULL AND pending_invitation_id IS NOT NULL)
);

-- Step 4: Drop the old unique constraint and create new one
ALTER TABLE trial_team_members
DROP CONSTRAINT IF EXISTS trial_team_members_trial_id_user_id_key;

-- Step 5: Add partial unique indexes for both cases
CREATE UNIQUE INDEX trial_team_members_trial_user_unique
ON trial_team_members(trial_id, user_id)
WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX trial_team_members_trial_invitation_unique
ON trial_team_members(trial_id, pending_invitation_id)
WHERE pending_invitation_id IS NOT NULL;

-- Step 6: Add index for pending invitations lookup
CREATE INDEX idx_trial_team_pending_invitation
ON trial_team_members(pending_invitation_id)
WHERE pending_invitation_id IS NOT NULL;

-- Step 7: Create function to resolve pending assignments when invitation is accepted
CREATE OR REPLACE FUNCTION resolve_trial_team_pending_assignments()
RETURNS TRIGGER AS $$
BEGIN
  -- When invitation status changes to 'accepted'
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Find the user by email
    UPDATE trial_team_members ttm
    SET
      user_id = u.id,
      pending_invitation_id = NULL
    FROM users u
    WHERE u.email = NEW.email
      AND ttm.pending_invitation_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Create trigger on invitations table
DROP TRIGGER IF EXISTS on_invitation_accepted_resolve_trial_team ON invitations;
CREATE TRIGGER on_invitation_accepted_resolve_trial_team
  AFTER UPDATE ON invitations
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status = 'pending')
  EXECUTE FUNCTION resolve_trial_team_pending_assignments();
