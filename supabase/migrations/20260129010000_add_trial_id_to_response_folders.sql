-- Add trial_id to response_folders table
ALTER TABLE response_folders
ADD COLUMN trial_id UUID REFERENCES trials(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_response_folders_trial_id
  ON response_folders(trial_id)
  WHERE deleted_at IS NULL;

-- Update existing folders to have NULL trial_id (they'll need to be re-created or manually assigned)
-- Or if you want to assign them to the first trial in responses_archived:
-- UPDATE response_folders rf
-- SET trial_id = (
--   SELECT DISTINCT trial_id
--   FROM responses_archived ra
--   WHERE ra.folder_id = rf.id
--   LIMIT 1
-- )
-- WHERE trial_id IS NULL;
