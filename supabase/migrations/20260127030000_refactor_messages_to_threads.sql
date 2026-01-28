-- ============================================================================
-- REFACTOR: Messages → Threads Architecture
-- ============================================================================
-- This migration completely rebuilds the messaging system with proper thread support.
-- BREAKING CHANGE: All existing messages will be deleted.
--
-- New architecture:
-- - message_threads: Conversations with participants at thread level
-- - thread_participants: Users in a thread (TO/CC designation)
-- - messages: Individual messages within threads
-- - message_attachments: Files attached to messages
--
-- Benefits:
-- - All participants see all messages in thread (like Slack/Gmail)
-- - Simple RLS (no recursion issues)
-- - Single query pattern (no manual deduplication)
-- - Scalable for large threads
-- ============================================================================

-- ============================================================================
-- 1. DROP OLD TABLES
-- ============================================================================

DROP TABLE IF EXISTS message_attachments CASCADE;
DROP TABLE IF EXISTS message_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE;

-- ============================================================================
-- 2. CREATE NEW TABLES
-- ============================================================================

-- Threads: Represents a conversation
CREATE TABLE message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT message_threads_subject_not_empty CHECK (LENGTH(TRIM(subject)) > 0)
);

-- Participants: Users in a thread (TO or CC)
CREATE TABLE thread_participants (
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('to', 'cc')),
  read_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (thread_id, user_id)
);

-- Messages: Individual messages within a thread
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
  sent_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  parent_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,

  CONSTRAINT messages_content_not_empty CHECK (LENGTH(TRIM(content)) > 0)
);

-- Attachments: Files/tasks/responses attached to messages
CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('task', 'response')),

  -- Task attachment: dynamic link
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Response attachment: JSONB snapshot
  response_snapshot JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT one_attachment_type CHECK (
    (attachment_type = 'task' AND task_id IS NOT NULL AND response_snapshot IS NULL) OR
    (attachment_type = 'response' AND task_id IS NULL AND response_snapshot IS NOT NULL)
  )
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

CREATE INDEX idx_message_threads_trial ON message_threads(trial_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_message_threads_created_by ON message_threads(created_by);

CREATE INDEX idx_thread_participants_user ON thread_participants(user_id);
CREATE INDEX idx_thread_participants_thread ON thread_participants(thread_id);

CREATE INDEX idx_messages_thread ON messages(thread_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_messages_sent_by ON messages(sent_by);
CREATE INDEX idx_messages_parent ON messages(parent_message_id) WHERE parent_message_id IS NOT NULL;

CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_task ON message_attachments(task_id) WHERE task_id IS NOT NULL;

-- ============================================================================
-- 4. ENABLE RLS
-- ============================================================================

ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. RLS POLICIES - SIMPLE & NO RECURSION
-- ============================================================================

-- ============================================================================
-- MESSAGE_THREADS POLICIES
-- ============================================================================

-- View threads where you're a participant
CREATE POLICY "message_threads_view" ON message_threads
  FOR SELECT USING (
    deleted_at IS NULL AND
    has_trial_access(trial_id) AND
    EXISTS (
      SELECT 1 FROM thread_participants
      WHERE thread_id = message_threads.id
      AND user_id = auth.uid()
    )
  );

-- Create threads if you have trial access
CREATE POLICY "message_threads_insert" ON message_threads
  FOR INSERT WITH CHECK (
    has_trial_access(trial_id) AND
    created_by = auth.uid()
  );

-- Update only threads you created (e.g., mark as deleted)
CREATE POLICY "message_threads_update" ON message_threads
  FOR UPDATE USING (created_by = auth.uid());

-- ============================================================================
-- THREAD_PARTICIPANTS POLICIES
-- ============================================================================

-- View participants of threads you're in
CREATE POLICY "thread_participants_view" ON thread_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = thread_participants.thread_id
      AND mt.deleted_at IS NULL
      AND has_trial_access(mt.trial_id)
    )
    AND (
      -- You can see participants if you're in the thread
      user_id = auth.uid() OR
      thread_id IN (
        SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
      )
    )
  );

-- Insert participants only when creating thread (must be thread creator)
CREATE POLICY "thread_participants_insert" ON thread_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM message_threads mt
      WHERE mt.id = thread_participants.thread_id
      AND mt.created_by = auth.uid()
      AND mt.deleted_at IS NULL
    )
  );

-- Update only your own participant record (for read_at)
CREATE POLICY "thread_participants_update" ON thread_participants
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

-- View messages from threads you're in
CREATE POLICY "messages_view" ON messages
  FOR SELECT USING (
    deleted_at IS NULL AND
    thread_id IN (
      SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
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

-- Update only your own messages (e.g., mark as deleted)
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (sent_by = auth.uid());

-- ============================================================================
-- MESSAGE_ATTACHMENTS POLICIES
-- ============================================================================

-- View attachments from messages you can see
CREATE POLICY "message_attachments_view" ON message_attachments
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      WHERE m.deleted_at IS NULL
      AND m.thread_id IN (
        SELECT thread_id FROM thread_participants WHERE user_id = auth.uid()
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
