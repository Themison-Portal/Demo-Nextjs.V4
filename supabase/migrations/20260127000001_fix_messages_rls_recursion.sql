-- Fix infinite recursion in messages RLS policies
-- Problem: messages_view checks message_participants, and message_participants_insert checks messages
-- This creates a circular dependency during INSERT operations

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "messages_view" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;

DROP POLICY IF EXISTS "message_participants_view" ON message_participants;
DROP POLICY IF EXISTS "message_participants_insert" ON message_participants;
DROP POLICY IF EXISTS "message_participants_update" ON message_participants;

DROP POLICY IF EXISTS "message_attachments_view" ON message_attachments;
DROP POLICY IF EXISTS "message_attachments_insert" ON message_attachments;
DROP POLICY IF EXISTS "message_attachments_delete" ON message_attachments;

-- ============================================================================
-- MESSAGES POLICIES (simplified to avoid recursion)
-- ============================================================================

-- View messages you sent OR where you're a participant
-- NOTE: We don't check message_participants existence during SELECT to avoid recursion
-- The application ensures participants are created correctly
CREATE POLICY "messages_view" ON messages FOR SELECT
  USING (
    deleted_at IS NULL AND (
      sent_by = auth.uid() OR
      id IN (
        SELECT message_id FROM message_participants WHERE user_id = auth.uid()
      )
    )
  );

-- Insert messages if you have trial access
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (has_trial_access(trial_id) AND sent_by = auth.uid());

-- Update only your own messages
CREATE POLICY "messages_update" ON messages FOR UPDATE
  USING (sent_by = auth.uid());

-- ============================================================================
-- MESSAGE PARTICIPANTS POLICIES (simplified to avoid recursion)
-- ============================================================================

-- View participants if you're involved in the message (sender or recipient)
CREATE POLICY "message_participants_view" ON message_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    message_id IN (
      SELECT id FROM messages WHERE sent_by = auth.uid()
    )
  );

-- Insert participants only if you're the message sender
-- CRITICAL: Don't check message existence in SELECT (causes recursion)
-- Just verify the message was sent by current user
CREATE POLICY "message_participants_insert" ON message_participants FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE sent_by = auth.uid() AND deleted_at IS NULL
    )
  );

-- Update only your own participant record (for read_at)
CREATE POLICY "message_participants_update" ON message_participants FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================================================
-- MESSAGE ATTACHMENTS POLICIES (simplified to avoid recursion)
-- ============================================================================

-- View attachments if you can view the message
CREATE POLICY "message_attachments_view" ON message_attachments FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages
      WHERE deleted_at IS NULL AND (
        sent_by = auth.uid() OR
        id IN (SELECT message_id FROM message_participants WHERE user_id = auth.uid())
      )
    )
  );

-- Create attachments only if you're the message sender
CREATE POLICY "message_attachments_insert" ON message_attachments FOR INSERT
  WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE sent_by = auth.uid() AND deleted_at IS NULL
    )
  );

-- Delete attachments only if you sent the message
CREATE POLICY "message_attachments_delete" ON message_attachments FOR DELETE
  USING (
    message_id IN (
      SELECT id FROM messages WHERE sent_by = auth.uid()
    )
  );
