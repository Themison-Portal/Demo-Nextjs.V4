-- ============================================================================
-- Re-enable RLS on message_threads ONLY - Simple policy, no recursion
-- ============================================================================
-- Test this first before touching other tables
-- ============================================================================

-- Re-enable RLS on message_threads
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

-- Simple SELECT policy: User can see threads where they are a participant
-- No recursion - just check thread_participants table directly
CREATE POLICY "message_threads_select" ON message_threads
  FOR SELECT USING (
    deleted_at IS NULL
    AND
    id IN (
      SELECT thread_id
      FROM thread_participants
      WHERE user_id = auth.uid()
    )
  );

-- Simple INSERT policy: Only creator can create (backend validates trial access)
CREATE POLICY "message_threads_insert" ON message_threads
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

-- Simple UPDATE policy: Only creator can update
CREATE POLICY "message_threads_update" ON message_threads
  FOR UPDATE USING (
    created_by = auth.uid()
  );
