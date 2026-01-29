-- ============================================================================
-- REMOVE FOREIGN KEY CONSTRAINTS FROM activity_type_id
-- ============================================================================
-- The foreign key constraints on visit_activities.activity_type_id and
-- tasks.activity_type_id prevent the use of flexible activity_ids that can
-- exist in trial_activity_types (custom) or simply be strings not in any table.
--
-- The system is designed to allow activity_ids as flexible strings:
-- 1. Lookup in trial_activity_types (trial-specific custom)
-- 2. Fallback to activity_types (global boilerplate)
-- 3. Fallback to activity_id as-is if not found
--
-- This migration removes the foreign key constraints to enable this design.
-- ============================================================================

-- Drop foreign key constraint from visit_activities
ALTER TABLE visit_activities
  DROP CONSTRAINT IF EXISTS visit_activities_activity_type_id_fkey;

-- Drop foreign key constraint from tasks
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_activity_type_id_fkey;

-- Update comments to reflect new behavior
COMMENT ON COLUMN visit_activities.activity_type_id IS
  'Activity identifier (string). Looked up in: trial_activity_types → activity_types → used as-is.
   No foreign key constraint - allows flexible activity IDs.';

COMMENT ON COLUMN tasks.activity_type_id IS
  'Activity identifier that generated this task. Looked up in: trial_activity_types → activity_types → used as-is.
   No foreign key constraint - allows flexible activity IDs. NULL if manual task.';
