-- ============================================================================
-- CLEANUP PATIENT SCHEMA
-- ============================================================================
-- Removes redundant columns and clarifies patient lifecycle dates.
--
-- Patient lifecycle:
--   created_at < screening_date < enrollment_date <= baseline_date <= baseline_deadline_date
--
-- Changes:
--   - Rename visit_start_date → baseline_date (clearer naming)
--   - Drop randomization_date (redundant with baseline_date)
--   - Add baseline_deadline_date (calculated deadline for enrollment)
-- ============================================================================

-- ============================================================================
-- PART 1: Patients table cleanup
-- ============================================================================

-- Rename visit_start_date → baseline_date
ALTER TABLE patients RENAME COLUMN visit_start_date TO baseline_date;

-- Drop randomization_date (redundant)
ALTER TABLE patients DROP COLUMN IF EXISTS randomization_date;

-- Add baseline_deadline_date
ALTER TABLE patients ADD COLUMN IF NOT EXISTS baseline_deadline_date DATE;

-- Add comments
COMMENT ON COLUMN patients.screening_date IS
  'Date of screening visit (Visit 1). First patient visit.';

COMMENT ON COLUMN patients.enrollment_date IS
  'Administrative date when patient enrollment was approved (decision date).';

COMMENT ON COLUMN patients.baseline_date IS
  'Scheduled date for Day 0 (Baseline/Visit 2). Same as randomization date if applicable.
   Set during enrollment process.';

COMMENT ON COLUMN patients.baseline_deadline_date IS
  'Calculated deadline for baseline visit based on template window.
   Formula: screening_date + days_between_screening_and_baseline.
   Patient must be enrolled before this date.';

-- ============================================================================
-- PART 2: Fix tasks.priority to be nullable (from Phase 1)
-- ============================================================================

-- This was created in Phase 1 migration but need to update constraint from existing schema

-- Drop existing constraint
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_priority_check;

-- Make column nullable if not already
ALTER TABLE tasks ALTER COLUMN priority DROP NOT NULL;
ALTER TABLE tasks ALTER COLUMN priority DROP DEFAULT;

-- Add new constraint that allows NULL
ALTER TABLE tasks ADD CONSTRAINT tasks_priority_check
  CHECK (priority IS NULL OR priority = ANY(ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text]));

COMMENT ON COLUMN tasks.priority IS
  'Optional task priority: low | medium | high | urgent.
   NULL if no priority assigned (Trello-style).';

-- ============================================================================
-- PART 3: Update visits.status_check constraint (from Phase 1)
-- ============================================================================

-- Drop old constraint
ALTER TABLE visits DROP CONSTRAINT IF EXISTS visits_status_check;

-- Add updated constraint with new statuses
ALTER TABLE visits ADD CONSTRAINT visits_status_check
  CHECK (status IN (
    'scheduled',    -- Initial state after creation
    'rescheduled',  -- Visit date was changed
    'completed',    -- Visit finished successfully
    'incompleted',  -- Visit happened but not all activities completed
    'suspended',    -- Visit temporarily on hold
    'missed',       -- Patient didn't show up
    'cancelled'     -- Visit cancelled
  ));
