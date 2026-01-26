-- Add category column to trial_documents
-- Allows categorization of documents (protocol, regulatory, consent, etc.)

ALTER TABLE trial_documents
ADD COLUMN category TEXT;

-- Add check constraint for valid categories
ALTER TABLE trial_documents
ADD CONSTRAINT trial_documents_category_check
CHECK (category IN (
  'protocol',
  'regulatory',
  'consent',
  'ops',
  'safety',
  'admin',
  'other'
));

-- Add index for filtering by category
CREATE INDEX idx_trial_documents_category ON trial_documents(category) WHERE deleted_at IS NULL;
