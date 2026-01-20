-- Add screening_date column to patients table
-- This stores the actual date the patient started screening (Visit 1)
-- visit_start_date remains as the calculated Day 0/Baseline date

ALTER TABLE patients
ADD COLUMN IF NOT EXISTS screening_date DATE;

COMMENT ON COLUMN patients.screening_date IS
  'Actual date when patient started screening process (Visit 1).
   Used to calculate visit_start_date (Day 0/Baseline) based on template offsets.';
