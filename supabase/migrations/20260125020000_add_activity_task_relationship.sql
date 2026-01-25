-- Add visit_activity_id FK to tasks table
-- This creates a 1:1 relationship between tasks created from visits and their activities
-- Tasks created manually (source='manual') will have visit_activity_id = NULL

ALTER TABLE tasks
ADD COLUMN visit_activity_id UUID REFERENCES visit_activities(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_tasks_visit_activity ON tasks(visit_activity_id);

-- Add clinical_data JSONB column to visit_activities
-- This will store structured clinical data (checklists, forms, results, etc.)
ALTER TABLE visit_activities
ADD COLUMN clinical_data JSONB DEFAULT NULL;

-- Add index for JSONB queries (if needed in the future)
CREATE INDEX idx_visit_activities_clinical_data ON visit_activities USING GIN (clinical_data);

-- Comment for documentation
COMMENT ON COLUMN tasks.visit_activity_id IS 'FK to visit_activities for tasks created from visit hydration (source=visit). NULL for manual tasks.';
COMMENT ON COLUMN visit_activities.clinical_data IS 'Structured clinical data (checklists, lab results, vital signs, etc.) in JSONB format';
