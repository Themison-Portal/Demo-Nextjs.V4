-- Add full_name as a generated column
-- Combines first_name and last_name automatically
-- Date: 2026-01-17

ALTER TABLE users
ADD COLUMN full_name TEXT GENERATED ALWAYS AS (
  NULLIF(TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')), '')
) STORED;

-- Add index for potential searches by full_name
CREATE INDEX idx_users_full_name ON users(full_name);
