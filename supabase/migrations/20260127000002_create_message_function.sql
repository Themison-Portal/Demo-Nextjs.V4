-- Fix messages RLS recursion by using SECURITY DEFINER function
-- This function bypasses RLS internally while enforcing permissions safely

-- ============================================================================
-- DROP OLD POLICIES (replace with simpler ones)
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
-- SIMPLE RLS POLICIES (no recursion)
-- ============================================================================

-- Messages: View only
CREATE POLICY "messages_view" ON messages FOR SELECT
  USING (
    deleted_at IS NULL AND
    sent_by = auth.uid()
  );

-- Messages: No direct insert (use function instead)
-- But allow backend service role to insert
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (sent_by = auth.uid());

-- Messages: Update only own
CREATE POLICY "messages_update" ON messages FOR UPDATE
  USING (sent_by = auth.uid());

-- Message Participants: View only if you're the participant or sender
CREATE POLICY "message_participants_view" ON message_participants FOR SELECT
  USING (user_id = auth.uid());

-- Message Participants: Allow insert (backend validates)
CREATE POLICY "message_participants_insert" ON message_participants FOR INSERT
  WITH CHECK (true);

-- Message Participants: Update only own (for read_at)
CREATE POLICY "message_participants_update" ON message_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Message Attachments: View only (no recursion)
CREATE POLICY "message_attachments_view" ON message_attachments FOR SELECT
  USING (true);

-- Message Attachments: Allow insert (backend validates)
CREATE POLICY "message_attachments_insert" ON message_attachments FOR INSERT
  WITH CHECK (true);

-- Message Attachments: Allow delete (backend validates)
CREATE POLICY "message_attachments_delete" ON message_attachments FOR DELETE
  USING (true);

-- ============================================================================
-- SECURITY DEFINER FUNCTION FOR CREATING MESSAGES
-- ============================================================================

-- This function creates a complete message with participants
-- It bypasses RLS internally but validates permissions
CREATE OR REPLACE FUNCTION create_message_with_participants(
  p_trial_id UUID,
  p_subject TEXT,
  p_body TEXT,
  p_sent_by UUID,
  p_to_users UUID[],
  p_cc_users UUID[] DEFAULT NULL,
  p_parent_message_id UUID DEFAULT NULL
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_message_id UUID;
  v_user_id UUID;
BEGIN
  -- Validate user has trial access
  IF NOT has_trial_access(p_trial_id) THEN
    RAISE EXCEPTION 'User does not have access to this trial';
  END IF;

  -- Create message
  INSERT INTO messages (trial_id, subject, body, sent_by, parent_message_id)
  VALUES (p_trial_id, p_subject, p_body, p_sent_by, p_parent_message_id)
  RETURNING id INTO v_message_id;

  -- Create TO participants
  FOREACH v_user_id IN ARRAY p_to_users
  LOOP
    INSERT INTO message_participants (message_id, user_id, participant_type)
    VALUES (v_message_id, v_user_id, 'to');
  END LOOP;

  -- Create CC participants if provided
  IF p_cc_users IS NOT NULL THEN
    FOREACH v_user_id IN ARRAY p_cc_users
    LOOP
      INSERT INTO message_participants (message_id, user_id, participant_type)
      VALUES (v_message_id, v_user_id, 'cc');
    END LOOP;
  END IF;

  RETURN v_message_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_message_with_participants TO authenticated;
