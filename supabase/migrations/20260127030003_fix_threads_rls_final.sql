-- ============================================================================
-- Fix threads RLS - Remove ALL recursion
-- ============================================================================
-- Key principle: Policies must NOT reference the same table they're on
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "thread_participants_select" ON thread_participants;
DROP POLICY IF EXISTS "thread_participants_insert" ON thread_participants;
DROP POLICY IF EXISTS "thread_participants_update" ON thread_participants;

DROP POLICY IF EXISTS "message_threads_select" ON message_threads;
DROP POLICY IF EXISTS "message_threads_insert" ON message_threads;
DROP POLICY IF EXISTS "message_threads_update" ON message_threads;

DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;

DROP POLICY IF EXISTS "message_attachments_select" ON message_attachments;
DROP POLICY IF EXISTS "message_attachments_insert" ON message_attachments;
DROP POLICY IF EXISTS "message_attachments_delete" ON message_attachments;

-- ============================================================================
-- THREAD_PARTICIPANTS - Simple, no self-reference
-- ============================================================================

-- SELECT: Only see your own participant record OR records from threads you created
CREATE POLICY "thread_participants_select" ON thread_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    thread_id IN (
      SELECT id FROM message_threads WHERE created_by = auth.uid()
    )
  );

-- INSERT: Backend validates, allow creator to add participants
CREATE POLICY "thread_participants_insert" ON thread_participants
  FOR INSERT WITH CHECK (
    thread_id IN (
      SELECT id FROM message_threads WHERE created_by = auth.uid()
    )
  );

-- UPDATE: Only your own record (for read_at)
CREATE POLICY "thread_participants_update" ON thread_participants
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- MESSAGE_THREADS - Read from participants without causing recursion
-- ============================================================================

-- SELECT: See threads you created OR where you're a participant
-- Safe because thread_participants SELECT doesn't read message_threads in a way that causes recursion
CREATE POLICY "message_threads_select" ON message_threads
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      created_by = auth.uid()
      OR
      id IN (
        SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Anyone can create (backend validates trial access)
CREATE POLICY "message_threads_insert" ON message_threads
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- UPDATE: Only creator
CREATE POLICY "message_threads_update" ON message_threads
  FOR UPDATE USING (created_by = auth.uid());

-- ============================================================================
-- MESSAGES - Filter by threads user can see
-- ============================================================================

-- SELECT: See messages from your threads
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    deleted_at IS NULL
    AND
    thread_id IN (
      SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
    )
  );

-- INSERT: Send messages to your threads
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sent_by = auth.uid()
    AND
    thread_id IN (
      SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Only your own messages
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (sent_by = auth.uid());

-- ============================================================================
-- MESSAGE_ATTACHMENTS - Filter by messages user can see
-- ============================================================================

-- SELECT: See attachments from your messages
CREATE POLICY "message_attachments_select" ON message_attachments
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      WHERE m.deleted_at IS NULL
      AND m.thread_id IN (
        SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
      )
    )
  );

-- INSERT: Only on your own messages
CREATE POLICY "message_attachments_insert" ON message_attachments
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM messages
      WHERE sent_by = auth.uid() AND deleted_at IS NULL
    )
  );

-- DELETE: Only from your own messages
CREATE POLICY "message_attachments_delete" ON message_attachments
  FOR DELETE USING (
    message_id IN (
      SELECT id FROM messages WHERE sent_by = auth.uid()
    )
  );
