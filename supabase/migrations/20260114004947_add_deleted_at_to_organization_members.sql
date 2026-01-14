-- Add deleted_at column to organization_members for soft delete
ALTER TABLE organization_members
  ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for better query performance on non-deleted members
CREATE INDEX idx_organization_members_deleted_at
  ON organization_members(org_id, deleted_at)
  WHERE deleted_at IS NULL;
