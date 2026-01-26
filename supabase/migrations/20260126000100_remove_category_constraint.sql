-- Remove category check constraint from trial_documents
-- Validation will be handled by backend only

ALTER TABLE trial_documents
DROP CONSTRAINT IF EXISTS trial_documents_category_check;
