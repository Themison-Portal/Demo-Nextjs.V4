-- Add raw JSONB fields to responses_archived table
-- For storing citations, checklists, page numbers, and other metadata

ALTER TABLE responses_archived
ADD COLUMN IF NOT EXISTS question_raw JSONB,
ADD COLUMN IF NOT EXISTS answer_raw JSONB;

-- Add comment explaining the purpose
COMMENT ON COLUMN responses_archived.question_raw IS 'Raw question data with metadata (optional)';
COMMENT ON COLUMN responses_archived.answer_raw IS 'Raw answer data with citations, checklists, pages, etc (optional)';
