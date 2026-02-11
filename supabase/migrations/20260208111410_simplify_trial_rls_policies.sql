-- ============================================================================
-- Migration: Simplify trial-scoped RLS policies
-- ============================================================================
--
-- WHAT: Reduce 28 complex trial-scoped policies to 10 simple ones.
-- WHY:  Middleware already validates granular permissions (PI/CRC, assigned_to,
--       etc.) before any handler touches Supabase. RLS only needs to be a
--       safety net: "does this user belong to this trial?"
--
-- SAFETY:
--   - API routes: withOrgMember/withTrialMember middleware validates first
--   - Server Components: only query org-scoped tables (untouched by this migration)
--   - Direct PostgREST: worst case is a business-rule violation, not a security breach
--   - Contract tests: 15 tests validate middleware keeps blocking correctly
--
-- WHAT IS NOT TOUCHED:
--   - Org-scoped policies (organizations, organization_members, invitations, audit_logs)
--   - Personal policies (users, staff_members, chat_*, response_*, archive_*)
--   - Messaging policies (message_threads, thread_participants, messages, message_attachments)
--   - Helper functions: handle_new_user, is_staff, is_staff_with_support, is_org_admin,
--     is_org_superadmin, has_trial_access, get_user_org_ids
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHASE 1: DROP existing trial-scoped policies (28 total)
-- ============================================================================

-- trials (4)
DROP POLICY IF EXISTS "trials_org_admin_view" ON trials;
DROP POLICY IF EXISTS "trials_team_view" ON trials;
DROP POLICY IF EXISTS "trials_admin_insert" ON trials;
DROP POLICY IF EXISTS "trials_update" ON trials;

-- trial_team_members (4)
DROP POLICY IF EXISTS "trial_team_view" ON trial_team_members;
DROP POLICY IF EXISTS "trial_team_critical_insert" ON trial_team_members;
DROP POLICY IF EXISTS "trial_team_critical_update" ON trial_team_members;
DROP POLICY IF EXISTS "trial_team_critical_delete" ON trial_team_members;

-- tasks (3)
DROP POLICY IF EXISTS "tasks_view_trial" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;

-- patients (3)
DROP POLICY IF EXISTS "patients_view" ON patients;
DROP POLICY IF EXISTS "patients_insert" ON patients;
DROP POLICY IF EXISTS "patients_update" ON patients;

-- visits (3)
DROP POLICY IF EXISTS "visits_view" ON visits;
DROP POLICY IF EXISTS "visits_insert" ON visits;
DROP POLICY IF EXISTS "visits_update" ON visits;

-- visit_activities (3)
DROP POLICY IF EXISTS "visit_activities_view" ON visit_activities;
DROP POLICY IF EXISTS "visit_activities_insert" ON visit_activities;
DROP POLICY IF EXISTS "visit_activities_update" ON visit_activities;

-- documents (3)
DROP POLICY IF EXISTS "documents_view" ON documents;
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;

-- trial_documents (3)
DROP POLICY IF EXISTS "trial_documents_select_policy" ON trial_documents;
DROP POLICY IF EXISTS "trial_documents_insert_policy" ON trial_documents;
DROP POLICY IF EXISTS "trial_documents_update_policy" ON trial_documents;

-- trial_activity_types (2)
DROP POLICY IF EXISTS "Users can view trial activities they have access to" ON trial_activity_types;
DROP POLICY IF EXISTS "PI and Admins can manage trial activities" ON trial_activity_types;

-- ============================================================================
-- PHASE 2: DROP has_critical_permission (no longer used by any policy)
-- ============================================================================

DROP FUNCTION IF EXISTS has_critical_permission(UUID);

-- ============================================================================
-- PHASE 3: CREATE 10 simplified policies
-- ============================================================================

-- --------------------------------------------------------------------------
-- trials (3 policies — special case: INSERT keeps admin restriction)
-- --------------------------------------------------------------------------

CREATE POLICY "trials_select" ON trials
  FOR SELECT
  USING (has_trial_access(id));

CREATE POLICY "trials_insert" ON trials
  FOR INSERT
  WITH CHECK (
    is_org_admin(org_id) OR is_staff_with_support(org_id)
  );

CREATE POLICY "trials_update" ON trials
  FOR UPDATE
  USING (has_trial_access(id));

-- --------------------------------------------------------------------------
-- Tables with direct trial_id (1 FOR ALL each)
-- --------------------------------------------------------------------------

CREATE POLICY "trial_team_members_trial_access" ON trial_team_members
  FOR ALL
  USING (has_trial_access(trial_id))
  WITH CHECK (has_trial_access(trial_id));

CREATE POLICY "tasks_trial_access" ON tasks
  FOR ALL
  USING (has_trial_access(trial_id))
  WITH CHECK (has_trial_access(trial_id));

CREATE POLICY "patients_trial_access" ON patients
  FOR ALL
  USING (has_trial_access(trial_id))
  WITH CHECK (has_trial_access(trial_id));

CREATE POLICY "documents_trial_access" ON documents
  FOR ALL
  USING (has_trial_access(trial_id))
  WITH CHECK (has_trial_access(trial_id));

CREATE POLICY "trial_activity_types_trial_access" ON trial_activity_types
  FOR ALL
  USING (has_trial_access(trial_id))
  WITH CHECK (has_trial_access(trial_id));

-- --------------------------------------------------------------------------
-- trial_documents (1 FOR ALL — keeps deleted_at filter in USING)
-- --------------------------------------------------------------------------

CREATE POLICY "trial_documents_trial_access" ON trial_documents
  FOR ALL
  USING (has_trial_access(trial_id) AND deleted_at IS NULL)
  WITH CHECK (has_trial_access(trial_id));

-- --------------------------------------------------------------------------
-- Tables requiring joins to resolve trial_id (1 FOR ALL each)
-- --------------------------------------------------------------------------

-- visits → patients.trial_id
CREATE POLICY "visits_trial_access" ON visits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = visits.patient_id
        AND has_trial_access(p.trial_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = visits.patient_id
        AND has_trial_access(p.trial_id)
    )
  );

-- visit_activities → visits → patients.trial_id
CREATE POLICY "visit_activities_trial_access" ON visit_activities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM visits v
      JOIN patients p ON p.id = v.patient_id
      WHERE v.id = visit_activities.visit_id
        AND has_trial_access(p.trial_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits v
      JOIN patients p ON p.id = v.patient_id
      WHERE v.id = visit_activities.visit_id
        AND has_trial_access(p.trial_id)
    )
  );

COMMIT;
