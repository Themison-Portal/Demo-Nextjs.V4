-- ============================================================================
-- TRIAL ACTIVITY TYPES
-- ============================================================================
-- Extends global activity_types catalog with trial-specific custom activities.
-- Allows trials to define custom activities beyond the global boilerplate.
--
-- Flow:
--   1. Template uses activity_ids (strings) in JSONB
--   2. On template save/update:
--      - Check if activity exists in activity_types (global)
--      - If NOT, create in trial_activity_types (custom)
--   3. On hydration:
--      - Lookup metadata in trial_activity_types first
--      - Fallback to activity_types (global)
--      - Use activity_id as fallback if not found
-- ============================================================================

CREATE TABLE IF NOT EXISTS trial_activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL, -- 'medical_history', 'randomization', etc.
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_custom BOOLEAN DEFAULT true, -- TRUE = custom, FALSE = copied from global
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(trial_id, activity_id)
);

COMMENT ON TABLE trial_activity_types IS
  'Trial-specific activity types. Extends global activity_types catalog.
   Allows trials to define custom activities (e.g., from RAG or manual creation).';

COMMENT ON COLUMN trial_activity_types.is_custom IS
  'TRUE if created by user/RAG (custom), FALSE if copied from global boilerplate.';

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE trial_activity_types ENABLE ROW LEVEL SECURITY;

-- Users can see activities for trials they belong to
CREATE POLICY "Users can view trial activities they have access to"
  ON trial_activity_types FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM trial_team_members ttm
      JOIN organization_members om ON om.id = ttm.org_member_id
      WHERE ttm.trial_id = trial_activity_types.trial_id
        AND om.user_id = auth.uid()
        AND om.deleted_at IS NULL
    )
  );

-- PI and Admins can insert/update trial activities
CREATE POLICY "PI and Admins can manage trial activities"
  ON trial_activity_types FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM trial_team_members ttm
      JOIN organization_members om ON om.id = ttm.org_member_id
      WHERE ttm.trial_id = trial_activity_types.trial_id
        AND om.user_id = auth.uid()
        AND ttm.trial_role IN ('PI', 'Admin')
        AND om.deleted_at IS NULL
    )
  );

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX idx_trial_activity_types_trial_id
  ON trial_activity_types(trial_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_trial_activity_types_activity_id
  ON trial_activity_types(trial_id, activity_id)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- Updated trigger
-- ============================================================================

CREATE TRIGGER update_trial_activity_types_updated_at
  BEFORE UPDATE ON trial_activity_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
