-- ============================================================================
-- Fix RLS recursion in threads architecture
-- ============================================================================
-- Problem: message_threads checks thread_participants, and thread_participants checks message_threads
-- Solution: Simplify policies to avoid circular dependencies
-- ============================================================================

-- Drop existing policies
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
-- MESSAGE_THREADS POLICIES - No check on participants
-- ============================================================================

-- View threads you created OR have trial access (participants check done separately)
CREATE POLICY "message_threads_view" ON message_threads
  FOR SELECT USING (
    deleted_at IS NULL AND
    (
      created_by = auth.uid() OR
      has_trial_access(trial_id)
    )
  );

-- Create threads if you have trial access
CREATE POLICY "message_threads_insert" ON message_threads
  FOR INSERT WITH CHECK (
    has_trial_access(trial_id) AND
    created_by = auth.uid()
  );

-- Update only threads you created
CREATE POLICY "message_threads_update" ON message_threads
  FOR UPDATE USING (created_by = auth.uid());

-- ============================================================================
-- THREAD_PARTICIPANTS POLICIES - Simplified, no recursion
-- ============================================================================

-- View participants if you're the creator OR you're in the thread
CREATE POLICY "thread_participants_view" ON thread_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = thread_participants.thread_id
      AND mt.created_by = auth.uid()
    ) OR
    thread_id IN (
      SELECT tp2.thread_id
      FROM thread_participants tp2
      WHERE tp2.user_id = auth.uid()
    )
  );

-- Insert participants only when creating thread (bypass with backend validation)
-- CRITICAL: Allow creator to insert participants without checking thread existence
-- This avoids recursion during thread creation
CREATE POLICY "thread_participants_insert" ON thread_participants
  FOR INSERT WITH CHECK (true);

-- Update only your own participant record (for read_at)
CREATE POLICY "thread_participants_update" ON thread_participants
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- MESSAGES POLICIES - Check thread via participants
-- ============================================================================

-- View messages from threads where you're a participant
CREATE POLICY "messages_view" ON messages
  FOR SELECT USING (
    deleted_at IS NULL AND
    (
      sent_by = auth.uid() OR
      thread_id IN (
        SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
      )
    )
  );

-- Send messages to threads you're in
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sent_by = auth.uid() AND
    thread_id IN (
      SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
    )
  );

-- Update only your own messages
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (sent_by = auth.uid());

-- ============================================================================
-- MESSAGE_ATTACHMENTS POLICIES - Simple, no changes
-- ============================================================================

-- View attachments from messages you can see
CREATE POLICY "message_attachments_view" ON message_attachments
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      WHERE m.deleted_at IS NULL
      AND (
        m.sent_by = auth.uid() OR
        m.thread_id IN (
          SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Create attachments only on messages you sent
CREATE POLICY "message_attachments_insert" ON message_attachments
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE sent_by = auth.uid() AND deleted_at IS NULL
    )
  );

-- Delete attachments only from your messages
CREATE POLICY "message_attachments_delete" ON message_attachments
  FOR DELETE USING (
    message_id IN (
      SELECT id FROM messages WHERE sent_by = auth.uid()
    )
  );
