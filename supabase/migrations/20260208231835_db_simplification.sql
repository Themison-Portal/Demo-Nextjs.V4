-- ============================================================================
-- DB Simplification Migration
-- ============================================================================
--
-- WHAT:
--   1. Drop dead/migrated DB functions (hydration, preview, messages)
--   2. Enable RLS on activity_types (was missing)
--   3. Consolidate duplicate trigger functions
--   4. Optimize has_trial_access (PL/pgSQL → SQL with UNION ALL)
--
-- WHY:
--   Business logic moved to TypeScript (services/visits/hydration.ts).
--   DB should only store data + enforce row-level security.
--
-- SAFETY:
--   - All dropped functions have been rewritten in TypeScript
--   - create_message_with_participants has zero callers in codebase
--   - hydrate_visit_schedule is deprecated (superseded by split functions)
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: Drop dead/migrated functions
-- ============================================================================

-- Dead: zero callers in TS codebase (messages refactored to threads)
DROP FUNCTION IF EXISTS create_message_with_participants(UUID, TEXT, TEXT, UUID, UUID[], UUID[], UUID);

-- Deprecated: superseded by hydrate_screening_visit + hydrate_remaining_visits
DROP FUNCTION IF EXISTS hydrate_visit_schedule(UUID, UUID, DATE);

-- Migrated to TypeScript: services/visits/hydration.ts
DROP FUNCTION IF EXISTS hydrate_screening_visit(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS hydrate_remaining_visits(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS hydrate_remaining_visits(UUID, UUID, DATE, JSONB);
DROP FUNCTION IF EXISTS preview_enrollment(UUID, UUID, DATE);
DROP FUNCTION IF EXISTS recalculate_visit_schedule(UUID, DATE);
DROP FUNCTION IF EXISTS get_user_by_trial_role(UUID, TEXT);

-- ============================================================================
-- PHASE 2: Enable RLS on activity_types (was missing)
-- ============================================================================

ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;

-- Global read-only catalog: anyone authenticated can read
CREATE POLICY "activity_types_select" ON activity_types
  FOR SELECT USING (true);

-- ============================================================================
-- PHASE 3: Consolidate duplicate trigger functions
-- ============================================================================

-- Drop duplicate trigger functions (these duplicate update_updated_at_column)
DROP TRIGGER IF EXISTS trigger_update_chat_session_updated_at ON chat_sessions;
DROP FUNCTION IF EXISTS update_chat_session_updated_at();

DROP TRIGGER IF EXISTS trigger_trial_documents_updated_at ON trial_documents;
DROP FUNCTION IF EXISTS update_trial_documents_updated_at();

-- Recreate triggers using the generic function
CREATE TRIGGER trigger_update_chat_session_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_trial_documents_updated_at
  BEFORE UPDATE ON trial_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 4: Optimize has_trial_access
-- ============================================================================
-- Change from PL/pgSQL (3 sequential function calls) to pure SQL with
-- UNION ALL + EXISTS (short-circuits on first match).

CREATE OR REPLACE FUNCTION has_trial_access(trial_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- Check 1: Staff with support enabled
    SELECT 1
    FROM staff_members sm
    JOIN auth.users au ON au.id = sm.user_id
    JOIN trials t ON t.id = trial_id_param
    JOIN organizations o ON o.id = t.org_id AND o.support_enabled = true
    WHERE sm.user_id = auth.uid()
      AND sm.status = 'active'
      AND au.email LIKE '%@themison.com'

    UNION ALL

    -- Check 2: Org admin (superadmin/admin)
    SELECT 1
    FROM organization_members om
    JOIN trials t ON t.id = trial_id_param AND t.org_id = om.org_id
    WHERE om.user_id = auth.uid()
      AND om.org_role IN ('superadmin', 'admin')
      AND om.status = 'active'
      AND om.deleted_at IS NULL

    UNION ALL

    -- Check 3: Trial team member via org_member_id
    SELECT 1
    FROM trial_team_members ttm
    JOIN organization_members om ON om.id = ttm.org_member_id
    WHERE ttm.trial_id = trial_id_param
      AND om.user_id = auth.uid()
      AND om.deleted_at IS NULL
  );
$$;

COMMENT ON FUNCTION has_trial_access IS
  'Check if current user has access to a trial.
   Access via: staff+support, org admin, or trial team member.
   Optimized: pure SQL with UNION ALL + EXISTS (short-circuits).';

COMMIT;
