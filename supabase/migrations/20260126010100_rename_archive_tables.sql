-- Drop old response tables (unused)
DROP TABLE IF EXISTS response_snippets CASCADE;
DROP TABLE IF EXISTS response_folders CASCADE;

-- Rename new archive tables to standardized names
ALTER TABLE archive_folders RENAME TO response_folders;
ALTER TABLE saved_responses RENAME TO responses_archived;

-- Rename indexes for response_folders
ALTER INDEX idx_archive_folders_user_org RENAME TO idx_response_folders_user_org;

-- Rename indexes for responses_archived
ALTER INDEX idx_saved_responses_folder RENAME TO idx_responses_archived_folder;
ALTER INDEX idx_saved_responses_user_org RENAME TO idx_responses_archived_user_org;

-- Note: RLS policies are automatically renamed with the table
-- No need to rename them manually
