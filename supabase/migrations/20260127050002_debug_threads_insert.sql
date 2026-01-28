-- ============================================================================
-- DEBUG: Make INSERT permissive to test if auth.uid() is the problem
-- ============================================================================
-- This is temporary to see if INSERT works at all
-- If this works, we know auth.uid() is NULL or different from user.id
-- ============================================================================

DROP POLICY IF EXISTS "message_threads_insert" ON message_threads;

-- Temporarily allow all inserts (backend validates)
CREATE POLICY "message_threads_insert" ON message_threads
  FOR INSERT WITH CHECK (true);
