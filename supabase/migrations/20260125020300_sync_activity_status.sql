-- Sync visit_activities status with their linked tasks
-- This one-time migration auto-completes activities where their task is already completed

UPDATE visit_activities va
SET
  status = 'completed',
  completed_at = COALESCE(va.completed_at, NOW())
FROM tasks t
WHERE t.visit_activity_id = va.id
  AND t.status = 'completed'
  AND va.status = 'pending';

-- Log results
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Auto-completed % activities based on their completed tasks', updated_count;
END $$;
