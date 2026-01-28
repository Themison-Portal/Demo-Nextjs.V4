-- ============================================================================
-- Replace read_at with last_read_message_id
-- ============================================================================
-- Better tracking: know exactly which message user read, not just timestamp
-- ============================================================================

-- Add new column
ALTER TABLE thread_participants
  ADD COLUMN last_read_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- Drop old column
ALTER TABLE thread_participants
  DROP COLUMN read_at;

-- Add index for performance
CREATE INDEX idx_thread_participants_last_read
  ON thread_participants(last_read_message_id)
  WHERE last_read_message_id IS NOT NULL;
