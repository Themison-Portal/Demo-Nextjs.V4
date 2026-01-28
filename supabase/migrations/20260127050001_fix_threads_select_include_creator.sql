-- ============================================================================
-- Fix message_threads SELECT to include threads created by user
-- ============================================================================

DROP POLICY IF EXISTS "message_threads_select" ON message_threads;

CREATE POLICY "message_threads_select" ON message_threads
  FOR SELECT USING (
    deleted_at IS NULL
    AND
    (
      -- Threads where you're a participant
      id IN (
        SELECT thread_id
        FROM thread_participants
        WHERE user_id = auth.uid()
      )
      OR
      -- Threads you created (even if not a participant yet)
      created_by = auth.uid()
    )
  );
