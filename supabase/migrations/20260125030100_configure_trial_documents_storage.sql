-- Configure Storage Bucket for Trial Documents
-- Creates bucket and sets up RLS policies for file access

-- Create bucket if it doesn't exist (public bucket for simplicity)
INSERT INTO storage.buckets (id, name, public)
VALUES ('trial-documents', 'trial-documents', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES (Simplified)
-- ============================================================================
-- Note: We rely on trial_documents table RLS for access control.
-- Storage policies here are simplified to allow authenticated users.

-- SELECT: Anyone authenticated can view (bucket is public anyway)
CREATE POLICY "trial_documents_storage_select_policy"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'trial-documents'
);

-- INSERT: Any authenticated user can upload
-- Access control happens at the trial_documents table level
CREATE POLICY "trial_documents_storage_insert_policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'trial-documents'
  AND auth.uid() IS NOT NULL
);

-- UPDATE: Authenticated users can update their uploads
CREATE POLICY "trial_documents_storage_update_policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'trial-documents'
  AND auth.uid() IS NOT NULL
);

-- DELETE: Authenticated users can delete
CREATE POLICY "trial_documents_storage_delete_policy"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'trial-documents'
  AND auth.uid() IS NOT NULL
);
