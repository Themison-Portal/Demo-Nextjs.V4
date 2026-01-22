-- ============================================================================
-- UPDATE VISIT STATUS CONSTRAINT
-- ============================================================================
-- Adds new visit statuses: rescheduled, incompleted, suspended
-- Previous: scheduled, completed, missed, cancelled
-- New: scheduled, rescheduled, completed, incompleted, suspended, missed, cancelled
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

COMMENT ON COLUMN visits.status IS
  'Visit status: scheduled | rescheduled | completed | incompleted | suspended | missed | cancelled.
   Transitions can be manual (PATCH) or automatic (all activities completed → completed).';
