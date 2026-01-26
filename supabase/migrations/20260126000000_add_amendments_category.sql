-- Add 'amendments' to trial_documents category constraint
-- This allows the new 'amendments' category option

-- Drop the existing constraint
ALTER TABLE trial_documents
DROP CONSTRAINT trial_documents_category_check;

-- Recreate with 'amendments' included
ALTER TABLE trial_documents
ADD CONSTRAINT trial_documents_category_check
CHECK (category IN (
  'protocol',
  'amendments',
  'regulatory',
  'consent',
  'ops',
  'safety',
  'admin',
  'other'
));
