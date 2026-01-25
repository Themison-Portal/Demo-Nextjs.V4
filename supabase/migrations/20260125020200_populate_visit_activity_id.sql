-- Populate visit_activity_id for existing tasks
-- This migration links existing tasks to their corresponding visit_activities
-- by matching visit_id + activity_type_id

-- Update tasks that come from visits (source='visit') and have matching activities
UPDATE tasks t
SET visit_activity_id = va.id
FROM visit_activities va
WHERE t.source = 'visit'
  AND t.visit_id = va.visit_id
  AND t.activity_type_id = va.activity_type_id
  AND t.visit_activity_id IS NULL; -- Only update tasks that haven't been linked yet

-- Log how many tasks were updated
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % tasks with visit_activity_id', updated_count;
END $$;
