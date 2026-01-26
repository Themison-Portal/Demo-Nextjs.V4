-- Trial Documents Table
-- Stores metadata for documents uploaded to trials (protocols, etc.)
-- Files are stored in Supabase Storage, this table tracks metadata and processing status

CREATE TABLE trial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL, -- MIME type (e.g., 'application/pdf')
  storage_path TEXT NOT NULL, -- Path in Supabase Storage bucket
  storage_url TEXT NOT NULL, -- Public or signed URL to access file
  status TEXT DEFAULT 'uploading' CHECK (status IN ('uploading', 'processing', 'ready', 'error')),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processing_error TEXT, -- Error message if status = 'error'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Index for querying documents by trial
CREATE INDEX idx_trial_documents_trial_id ON trial_documents(trial_id) WHERE deleted_at IS NULL;

-- Index for querying by status
CREATE INDEX idx_trial_documents_status ON trial_documents(status) WHERE deleted_at IS NULL;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_trial_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_trial_documents_updated_at
  BEFORE UPDATE ON trial_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_trial_documents_updated_at();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE trial_documents ENABLE ROW LEVEL SECURITY;

-- SELECT: Trial team members + org members with support
CREATE POLICY "trial_documents_select_policy" ON trial_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trials t
      WHERE t.id = trial_documents.trial_id
      AND (
        -- Trial team member
        EXISTS (
          SELECT 1 FROM trial_team_members ttm
          INNER JOIN organization_members om ON ttm.org_member_id = om.id
          WHERE ttm.trial_id = t.id
          AND om.user_id = auth.uid()
        )
        -- Or staff with support
        OR is_staff_with_support(t.org_id)
      )
    )
    AND deleted_at IS NULL
  );

-- INSERT: Trial team members only
CREATE POLICY "trial_documents_insert_policy" ON trial_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trials t
      WHERE t.id = trial_documents.trial_id
      AND EXISTS (
        SELECT 1 FROM trial_team_members ttm
        INNER JOIN organization_members om ON ttm.org_member_id = om.id
        WHERE ttm.trial_id = t.id
        AND om.user_id = auth.uid()
      )
    )
  );

-- UPDATE: Trial team members only
CREATE POLICY "trial_documents_update_policy" ON trial_documents
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trials t
      WHERE t.id = trial_documents.trial_id
      AND EXISTS (
        SELECT 1 FROM trial_team_members ttm
        INNER JOIN organization_members om ON ttm.org_member_id = om.id
        WHERE ttm.trial_id = t.id
        AND om.user_id = auth.uid()
      )
    )
    AND deleted_at IS NULL
  );
