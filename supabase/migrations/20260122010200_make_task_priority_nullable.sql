-- ============================================================================
-- MAKE TASK PRIORITY NULLABLE
-- ============================================================================
-- Allows tasks to have no priority (like Trello).
-- Tasks are created with priority = NULL by default.
-- Users can optionally assign priority: low, medium, high, urgent.
-- ============================================================================

-- Make priority nullable
ALTER TABLE tasks ALTER COLUMN priority DROP NOT NULL;

-- Set default to NULL
ALTER TABLE tasks ALTER COLUMN priority SET DEFAULT NULL;

COMMENT ON COLUMN tasks.priority IS
  'Optional task priority: low | medium | high | urgent.
   NULL if no priority assigned (Trello-style).';
