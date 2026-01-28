-- Create message_attachments table for linking tasks and DA responses to messages

CREATE TABLE message_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,

  -- Type of attachment: task or response
  attachment_type TEXT NOT NULL CHECK (attachment_type IN ('task', 'response')),

  -- Task: dynamic link to real task
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,

  -- Response: JSONB snapshot (same format as responses_archived.raw_data)
  response_snapshot JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: only one type can exist per attachment
  CONSTRAINT one_attachment_type CHECK (
    (attachment_type = 'task' AND task_id IS NOT NULL AND response_snapshot IS NULL) OR
    (attachment_type = 'response' AND task_id IS NULL AND response_snapshot IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_message_attachments_task ON message_attachments(task_id) WHERE task_id IS NOT NULL;

-- Enable RLS
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: View attachments if you can view the message
CREATE POLICY "message_attachments_view" ON message_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.deleted_at IS NULL
      AND (
        m.sent_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM message_participants mp
          WHERE mp.message_id = m.id AND mp.user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policy: Create attachments if you're creating the message
CREATE POLICY "message_attachments_insert" ON message_attachments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.sent_by = auth.uid()
    )
  );

-- RLS Policy: Delete attachments if you sent the message
CREATE POLICY "message_attachments_delete" ON message_attachments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.id = message_attachments.message_id
      AND m.sent_by = auth.uid()
    )
  );
