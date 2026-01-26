-- Response Archive Tables
-- Users can save AI responses in personal folders

-- 1. Archive Folders (personal folders for organizing responses)
CREATE TABLE archive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Index for user queries (most common: get my folders in this org)
CREATE INDEX idx_archive_folders_user_org ON archive_folders(user_id, org_id, deleted_at);

-- RLS: Users can only see their own folders
ALTER TABLE archive_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
  ON archive_folders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own folders"
  ON archive_folders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own folders"
  ON archive_folders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own folders"
  ON archive_folders FOR DELETE
  USING (user_id = auth.uid());


-- 2. Saved Responses (AI responses saved by users)
CREATE TABLE saved_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES archive_folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Content
  title TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  question_raw JSONB,
  answer_raw JSONB,
  document_id UUID REFERENCES trial_documents(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Index for folder queries (most common: get all responses in folder)
CREATE INDEX idx_saved_responses_folder ON saved_responses(folder_id, deleted_at);

-- Index for user queries (fallback: get all my responses)
CREATE INDEX idx_saved_responses_user_org ON saved_responses(user_id, org_id, deleted_at);

-- RLS: Users can only see their own saved responses
ALTER TABLE saved_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved responses"
  ON saved_responses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own saved responses"
  ON saved_responses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saved responses"
  ON saved_responses FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own saved responses"
  ON saved_responses FOR DELETE
  USING (user_id = auth.uid());
