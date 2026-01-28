-- ============================================================================
-- Simple RLS for threads - No business logic, just data filtering
-- ============================================================================
-- Philosophy: Backend validates permissions, RLS only filters what you can see
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "message_threads_view" ON message_threads;
DROP POLICY IF EXISTS "message_threads_insert" ON message_threads;
DROP POLICY IF EXISTS "message_threads_update" ON message_threads;

DROP POLICY IF EXISTS "thread_participants_view" ON thread_participants;
DROP POLICY IF EXISTS "thread_participants_insert" ON thread_participants;
DROP POLICY IF EXISTS "thread_participants_update" ON thread_participants;

DROP POLICY IF EXISTS "messages_view" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;

DROP POLICY IF EXISTS "message_attachments_view" ON message_attachments;
DROP POLICY IF EXISTS "message_attachments_insert" ON message_attachments;
DROP POLICY IF EXISTS "message_attachments_delete" ON message_attachments;

-- ============================================================================
-- THREAD_PARTICIPANTS - Start here to avoid recursion
-- ============================================================================

-- View: See participants if you're in the thread OR you created it
CREATE POLICY "thread_participants_select" ON thread_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    thread_id IN (
      SELECT tp.thread_id
      FROM thread_participants tp
      WHERE tp.user_id = auth.uid()
    )
    OR
    thread_id IN (
      SELECT mt.id
      FROM message_threads mt
      WHERE mt.created_by = auth.uid()
    )
  );

-- Insert: Allow if you're creating the thread (backend validates access)
CREATE POLICY "thread_participants_insert" ON thread_participants
  FOR INSERT WITH CHECK (
    thread_id IN (
      SELECT id FROM message_threads WHERE created_by = auth.uid()
    )
  );

-- Update: Only your own record (for read_at)
CREATE POLICY "thread_participants_update" ON thread_participants
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- MESSAGE_THREADS - Reference participants without causing recursion
-- ============================================================================

-- View: See threads you created OR threads where you're a participant
CREATE POLICY "message_threads_select" ON message_threads
  FOR SELECT USING (
    deleted_at IS NULL
    AND (
      created_by = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM thread_participants tp
        WHERE tp.thread_id = message_threads.id
        AND tp.user_id = auth.uid()
      )
    )
  );

-- Insert: Anyone can create threads (backend validates trial access)
CREATE POLICY "message_threads_insert" ON message_threads
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Update: Only creator can update
CREATE POLICY "message_threads_update" ON message_threads
  FOR UPDATE USING (created_by = auth.uid());

-- ============================================================================
-- MESSAGES - Simple filtering by thread participation
-- ============================================================================

-- View: See messages from threads you're in
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    deleted_at IS NULL
    AND
    EXISTS (
      SELECT 1 FROM thread_participants tp
      WHERE tp.thread_id = messages.thread_id
      AND tp.user_id = auth.uid()
    )
  );

-- Insert: Send messages to threads you're in
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sent_by = auth.uid()
    AND
    EXISTS (
      SELECT 1 FROM thread_participants tp
      WHERE tp.thread_id = messages.thread_id
      AND tp.user_id = auth.uid()
    )
  );

-- Update: Only your own messages
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (sent_by = auth.uid());

-- ============================================================================
-- MESSAGE_ATTACHMENTS - Filter by message access
-- ============================================================================

-- View: See attachments from messages you can see
CREATE POLICY "message_attachments_select" ON message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      INNER JOIN thread_participants tp ON tp.thread_id = m.thread_id
      WHERE m.id = message_attachments.message_id
      AND m.deleted_at IS NULL
      AND tp.user_id = auth.uid()
    )
  );

-- Insert: Only on your own messages
CREATE POLICY "message_attachments_insert" ON message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.sent_by = auth.uid()
      AND m.deleted_at IS NULL
    )
  );

-- Delete: Only from your own messages
CREATE POLICY "message_attachments_delete" ON message_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.sent_by = auth.uid()
    )
  );
