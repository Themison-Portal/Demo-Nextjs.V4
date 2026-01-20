-- ============================================================================
-- VISIT TEMPLATE SYSTEM (JSONB-based)
-- ============================================================================
-- This migration transitions from relational visit templates to JSONB-based
-- templates stored in trials table. This enables:
-- 1. Easy template creation from RAG (single JSON insert)
-- 2. Simple template versioning
-- 3. Cleaner API for template CRUD
-- 4. Support for negative day offsets (pre-baseline visits)
-- 5. Day 0 designation (reference date for schedule calculation)
-- ============================================================================

-- ============================================================================
-- PART 1: Create activity types catalog (global)
-- ============================================================================

CREATE TABLE IF NOT EXISTS activity_types (
  id TEXT PRIMARY KEY, -- 'blood_draw', 'ecg', etc.
  name TEXT NOT NULL, -- 'Blood Draw', 'ECG', etc.
  category TEXT, -- 'lab', 'diagnostic', 'admin', etc.
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

COMMENT ON TABLE activity_types IS
  'Global catalog of clinical trial activities. Shared across all trials.';

-- Seed common clinical trial activities
INSERT INTO activity_types (id, name, category, description) VALUES
  ('blood_draw', 'Blood Draw', 'lab', 'Venipuncture for blood sample collection'),
  ('ecg', 'ECG', 'diagnostic', 'Electrocardiogram'),
  ('vitals', 'Vital Signs', 'nursing', 'Blood pressure, heart rate, temperature, etc.'),
  ('consent', 'Informed Consent', 'admin', 'Obtain patient informed consent'),
  ('xray', 'X-Ray', 'diagnostic', 'Radiographic imaging'),
  ('urine_sample', 'Urine Sample', 'lab', 'Urine collection for analysis'),
  ('physical_exam', 'Physical Examination', 'clinical', 'Complete physical examination by physician'),
  ('questionnaire', 'Patient Questionnaire', 'admin', 'Patient-reported outcome questionnaire'),
  ('drug_dispensing', 'Drug Dispensing', 'pharmacy', 'Investigational product dispensing'),
  ('adverse_event', 'Adverse Event Assessment', 'safety', 'AE/SAE evaluation and documentation')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 2: Add JSONB template column to trials
-- ============================================================================

ALTER TABLE trials
ADD COLUMN IF NOT EXISTS visit_schedule_template JSONB;

COMMENT ON COLUMN trials.visit_schedule_template IS
  'JSONB template defining visit schedule and activity assignments.
   Structure: { version, visits: [...], assignees: {...} }
   Exactly one visit must have is_day_zero: true';

-- ============================================================================
-- PART 3: Add validation function for template
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_visit_template(template JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  day_zero_count INTEGER;
  visit JSONB;
  visit_orders INTEGER[];
  visit_names TEXT[];
BEGIN
  -- Template can be NULL
  IF template IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Must have visits array
  IF template->'visits' IS NULL THEN
    RAISE EXCEPTION 'Template must have a "visits" array';
  END IF;

  -- Count visits marked as day_zero
  SELECT COUNT(*) INTO day_zero_count
  FROM jsonb_array_elements(template->'visits') AS visit
  WHERE (visit->>'is_day_zero')::boolean = true;

  -- Must have exactly one day_zero
  IF day_zero_count != 1 THEN
    RAISE EXCEPTION 'Template must have exactly one visit marked as is_day_zero=true, found %', day_zero_count;
  END IF;

  -- Check for duplicate visit orders
  SELECT ARRAY_AGG((visit->>'order')::integer) INTO visit_orders
  FROM jsonb_array_elements(template->'visits') AS visit;

  IF (SELECT COUNT(DISTINCT unnest) FROM unnest(visit_orders)) != array_length(visit_orders, 1) THEN
    RAISE EXCEPTION 'Template has duplicate visit orders';
  END IF;

  -- Check for duplicate visit names
  SELECT ARRAY_AGG(visit->>'name') INTO visit_names
  FROM jsonb_array_elements(template->'visits') AS visit;

  IF (SELECT COUNT(DISTINCT unnest) FROM unnest(visit_names)) != array_length(visit_names, 1) THEN
    RAISE EXCEPTION 'Template has duplicate visit names';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add check constraint
ALTER TABLE trials
DROP CONSTRAINT IF EXISTS valid_visit_template;

ALTER TABLE trials
ADD CONSTRAINT valid_visit_template
CHECK (
  visit_schedule_template IS NULL OR
  validate_visit_template(visit_schedule_template)
);

-- ============================================================================
-- PART 4: Add randomization_date to patients
-- ============================================================================

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS randomization_date DATE;

COMMENT ON COLUMN patients.randomization_date IS
  'Date when patient was randomized. Used to recalculate visit schedules.
   When set, visit_start_date should be updated and all task due dates recalculated.';

-- ============================================================================
-- PART 5: Modify visits table structure
-- ============================================================================

-- Add new columns for JSONB-based system
ALTER TABLE visits
ADD COLUMN IF NOT EXISTS visit_template_name TEXT,
ADD COLUMN IF NOT EXISTS days_from_day_zero INTEGER,
ADD COLUMN IF NOT EXISTS is_day_zero BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN visits.visit_template_name IS
  'Visit name copied from template. Preserved even if template is deleted/modified.';

COMMENT ON COLUMN visits.days_from_day_zero IS
  'Offset in days from day zero. Can be negative for pre-baseline visits (e.g. -14 for screening).';

COMMENT ON COLUMN visits.is_day_zero IS
  'Whether this visit is the day zero reference visit (typically baseline).';

-- visit_template_id is already nullable in original schema, keep for backwards compat

-- ============================================================================
-- PART 6: Modify visit_activities table structure
-- ============================================================================

ALTER TABLE visit_activities
ADD COLUMN IF NOT EXISTS activity_type_id TEXT REFERENCES activity_types(id) ON DELETE SET NULL;

COMMENT ON COLUMN visit_activities.activity_type_id IS
  'Reference to global activity catalog. NULL if custom activity not in catalog.';

-- ============================================================================
-- PART 7: Modify tasks table structure
-- ============================================================================

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS activity_type_id TEXT REFERENCES activity_types(id) ON DELETE SET NULL;

COMMENT ON COLUMN tasks.activity_type_id IS
  'Reference to activity that generated this task. NULL if manual task or activity not in catalog.';

-- ============================================================================
-- PART 8: Drop old relational template tables
-- ============================================================================
-- These tables are replaced by the JSONB template system.
-- Dropping them now since there's no production data yet.

DROP TABLE IF EXISTS visit_activity_templates CASCADE;
DROP TABLE IF EXISTS visit_schedule_templates CASCADE;

-- ============================================================================
-- PART 9: Add indexes for performance
-- ============================================================================

-- Index for activity lookups
CREATE INDEX IF NOT EXISTS idx_activity_types_category ON activity_types(category) WHERE deleted_at IS NULL;

-- Index for visit queries by patient
CREATE INDEX IF NOT EXISTS idx_visits_patient_id ON visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_date ON visits(scheduled_date);

-- Index for task queries
CREATE INDEX IF NOT EXISTS idx_tasks_activity_type ON tasks(activity_type_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE deleted_at IS NULL;

-- Index for visit_activities
CREATE INDEX IF NOT EXISTS idx_visit_activities_activity_type ON visit_activities(activity_type_id);
CREATE INDEX IF NOT EXISTS idx_visit_activities_visit_id ON visit_activities(visit_id);
