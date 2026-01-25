-- Add category field to tasks table for manual categorization
-- Tasks can have category from:
-- 1. Direct assignment (task.category) - for manual tasks
-- 2. Activity type (activity_types.category) - for tasks from visit schedules

ALTER TABLE public.tasks
ADD COLUMN category text NULL;

COMMENT ON COLUMN public.tasks.category IS 'Direct category assignment for manual tasks. If null, category comes from activity_type.';
