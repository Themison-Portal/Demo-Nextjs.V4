-- ============================================================================
-- DEBUG: Threads RLS - Add explicit GRANTs and permissive policies
-- ============================================================================
-- This migration isolates the INSERT failure issue by:
-- 1. Adding explicit table GRANTs (may be missing)
-- 2. Making policies more permissive temporarily
-- 3. Adding validation in policies to help debug
--
-- If this works, we know auth.uid() works and it's a policy issue
-- If this fails, it's a deeper issue (permissions, auth context, etc)
-- ============================================================================

-- ============================================================================
-- 1. EXPLICIT GRANTS (may be missing)
-- ============================================================================

-- Grant ALL permissions to authenticated users
-- These may be implicitly granted by Supabase, but making them explicit
GRANT ALL ON message_threads TO authenticated;
GRANT ALL ON thread_participants TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_attachments TO authenticated;

-- Grant USAGE on sequences (if any)
-- Not needed for UUID primary keys, but good practice
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================================================
-- 2. DROP EXISTING POLICIES
-- ============================================================================

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
-- 3. PERMISSIVE POLICIES (for debugging)
-- ============================================================================

-- MESSAGE_THREADS: Very permissive to isolate issue

-- SELECT: Use existing function (should work based on report)
CREATE POLICY "message_threads_select" ON message_threads
  FOR SELECT USING (
    deleted_at IS NULL
    AND id IN (SELECT * FROM user_accessible_threads())
  );

-- INSERT: Make completely permissive first
-- If this works, we know it's a policy issue, not auth.uid()
CREATE POLICY "message_threads_insert" ON message_threads
  FOR INSERT WITH CHECK (
    -- Backend already validates trial access
    -- Just check that created_by is not null and matches current user
    created_by IS NOT NULL
    AND created_by = auth.uid()
  );

-- UPDATE: Only creator
CREATE POLICY "message_threads_update" ON message_threads
  FOR UPDATE USING (created_by = auth.uid());

-- ============================================================================
-- THREAD_PARTICIPANTS: Simplified
-- ============================================================================

-- SELECT: See your own record OR records from threads you're in
CREATE POLICY "thread_participants_select" ON thread_participants
  FOR SELECT USING (
    user_id = auth.uid()
    OR
    thread_id IN (SELECT * FROM user_accessible_threads())
  );

-- INSERT: Very permissive (backend validates)
CREATE POLICY "thread_participants_insert" ON thread_participants
  FOR INSERT WITH CHECK (
    -- Backend validates trial access
    -- Just check thread exists and is not deleted
    thread_id IN (
      SELECT id FROM message_threads
      WHERE deleted_at IS NULL
    )
  );

-- UPDATE: Only your own record
CREATE POLICY "thread_participants_update" ON thread_participants
  FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- MESSAGES: Simplified
-- ============================================================================

-- SELECT: See messages from your threads
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (
    deleted_at IS NULL
    AND thread_id IN (SELECT * FROM user_accessible_threads())
  );

-- INSERT: Very permissive (backend validates)
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    sent_by = auth.uid()
    AND thread_id IN (
      SELECT id FROM message_threads WHERE deleted_at IS NULL
    )
  );

-- UPDATE: Only your own messages
CREATE POLICY "messages_update" ON messages
  FOR UPDATE USING (sent_by = auth.uid());

-- ============================================================================
-- MESSAGE_ATTACHMENTS: Simplified
-- ============================================================================

-- SELECT: See attachments from your threads
CREATE POLICY "message_attachments_select" ON message_attachments
  FOR SELECT USING (
    message_id IN (
      SELECT m.id FROM messages m
      WHERE m.deleted_at IS NULL
      AND m.thread_id IN (SELECT * FROM user_accessible_threads())
    )
  );

-- INSERT: Very permissive (backend validates)
CREATE POLICY "message_attachments_insert" ON message_attachments
  FOR INSERT WITH CHECK (
    message_id IN (
      SELECT id FROM messages WHERE deleted_at IS NULL
    )
  );

-- DELETE: Very permissive (backend validates)
CREATE POLICY "message_attachments_delete" ON message_attachments
  FOR DELETE USING (
    message_id IN (
      SELECT id FROM messages WHERE sent_by = auth.uid()
    )
  );

-- ============================================================================
-- NOTES FOR NEXT STEPS
-- ============================================================================
-- If INSERT still fails after this migration:
--   1. Run /api/debug/auth to check auth.uid() context
--   2. Check Supabase logs for more detailed error
--   3. Try WITH CHECK (true) temporarily to isolate
--
-- If INSERT succeeds after this migration:
--   - The issue was GRANTs or policy complexity
--   - Can tighten policies in next migration
-- ============================================================================
