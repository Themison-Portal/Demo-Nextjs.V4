-- Drop the separate raw columns and replace with a single JSONB field
ALTER TABLE responses_archived
DROP COLUMN IF EXISTS question_raw,
DROP COLUMN IF EXISTS answer_raw,
ADD COLUMN raw_data JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN responses_archived.raw_data IS 'Complete raw data: { question: {...}, answer: { text, citations, pages, checklists, ... } }';
