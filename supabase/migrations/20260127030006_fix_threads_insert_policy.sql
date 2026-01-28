-- Fix threads INSERT policy to use has_trial_access() like other tables
-- The issue: auth.uid() doesn't work reliably in server-side context
-- Solution: Use has_trial_access() which is SECURITY DEFINER and handles auth correctly

DROP POLICY IF EXISTS "message_threads_insert" ON message_threads;

CREATE POLICY "message_threads_insert" ON message_threads
  FOR INSERT WITH CHECK (
    has_trial_access(trial_id)
    AND created_by = auth.uid()
  );
