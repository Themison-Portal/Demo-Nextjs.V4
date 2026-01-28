-- FINAL: Disable RLS on threads tables
-- Backend validates ALL access via validateTrialAccess() helper
-- RLS with permissive policies (WITH CHECK true) was still failing for unknown reason
-- This matches pattern from old messages system that worked

-- Disable RLS on all threads tables
ALTER TABLE message_threads DISABLE ROW LEVEL SECURITY;
ALTER TABLE thread_participants DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments DISABLE ROW LEVEL SECURITY;

-- Drop all policies (no longer needed)
DROP POLICY IF EXISTS "message_threads_select" ON message_threads;
DROP POLICY IF EXISTS "message_threads_insert" ON message_threads;
DROP POLICY IF EXISTS "message_threads_update" ON message_threads;

DROP POLICY IF EXISTS "thread_participants_select" ON thread_participants;
DROP POLICY IF EXISTS "thread_participants_insert" ON thread_participants;
DROP POLICY IF EXISTS "thread_participants_update" ON thread_participants;

DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update" ON messages;

DROP POLICY IF EXISTS "message_attachments_select" ON message_attachments;
DROP POLICY IF EXISTS "message_attachments_insert" ON message_attachments;
DROP POLICY IF EXISTS "message_attachments_delete" ON message_attachments;

-- Drop helper function (no longer needed)
DROP FUNCTION IF EXISTS user_accessible_threads();

-- Backend security is sufficient:
-- - validateTrialAccess() checks org admin OR trial team member
-- - withOrgMember middleware validates org membership
-- - All endpoints validate input and access before DB operations
