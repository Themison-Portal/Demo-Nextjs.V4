-- ============================================================================
-- Make trial_id nullable in message_threads
-- Allows general messages without trial context
-- ============================================================================

-- 1. Drop NOT NULL constraint on trial_id
ALTER TABLE message_threads
  ALTER COLUMN trial_id DROP NOT NULL;

-- 2. Update index to handle NULL values
DROP INDEX IF EXISTS idx_message_threads_trial;
CREATE INDEX idx_message_threads_trial ON message_threads(trial_id)
  WHERE deleted_at IS NULL AND trial_id IS NOT NULL;

-- 3. Add index for threads without trial
CREATE INDEX idx_message_threads_no_trial ON message_threads(id)
  WHERE deleted_at IS NULL AND trial_id IS NULL;
