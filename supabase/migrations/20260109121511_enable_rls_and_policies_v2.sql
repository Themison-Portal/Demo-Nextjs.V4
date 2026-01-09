-- Themison Clinical Trials Management System
-- RLS Policies Migration

-- ============================================================================
-- FIX FUNCTION SECURITY (search_path vulnerability)
-- ============================================================================

-- Re-create handle_new_user with proper security
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  -- Always create user mirror
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- If @themison.com AND email confirmed → create staff
  IF NEW.email LIKE '%@themison.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO public.staff_members (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Re-create update_updated_at_column with proper security
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Recreate all triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trials_updated_at BEFORE UPDATE ON trials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visit_templates_updated_at BEFORE UPDATE ON visit_schedule_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_folders_updated_at BEFORE UPDATE ON response_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS FOR RLS POLICIES
-- ============================================================================

-- Check if user is staff with support enabled for an org
CREATE OR REPLACE FUNCTION is_staff_with_support(org_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  user_email TEXT;
  org_support BOOLEAN;
BEGIN
  -- Get current user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = auth.uid();

  -- Check if staff member
  IF user_email NOT LIKE '%@themison.com' THEN
    RETURN FALSE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.staff_members WHERE user_id = auth.uid()) THEN
    RETURN FALSE;
  END IF;

  -- Check if support enabled for org
  SELECT support_enabled INTO org_support
  FROM public.organizations
  WHERE id = org_id_param;

  RETURN COALESCE(org_support, FALSE);
END;
$$;

-- Check if user is superadmin or admin in an org
CREATE OR REPLACE FUNCTION is_org_admin(org_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND org_id = org_id_param
    AND org_role IN ('superadmin', 'admin')
    AND status = 'active'
  );
END;
$$;

-- Check if user is superadmin in an org
CREATE OR REPLACE FUNCTION is_org_superadmin(org_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE user_id = auth.uid()
    AND org_id = org_id_param
    AND org_role = 'superadmin'
    AND status = 'active'
  );
END;
$$;

-- Check if user has access to a trial (team member OR org admin OR staff)
CREATE OR REPLACE FUNCTION has_trial_access(trial_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  trial_org_id UUID;
BEGIN
  -- Get trial's org_id
  SELECT org_id INTO trial_org_id
  FROM public.trials
  WHERE id = trial_id_param;

  -- Staff with support enabled
  IF is_staff_with_support(trial_org_id) THEN
    RETURN TRUE;
  END IF;

  -- Org admin
  IF is_org_admin(trial_org_id) THEN
    RETURN TRUE;
  END IF;

  -- Trial team member
  RETURN EXISTS (
    SELECT 1
    FROM public.trial_team_members
    WHERE trial_id = trial_id_param
    AND user_id = auth.uid()
  );
END;
$$;

-- Check if user has critical permissions (PI/CRC OR org admin OR staff)
CREATE OR REPLACE FUNCTION has_critical_permission(trial_id_param UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  trial_org_id UUID;
BEGIN
  -- Get trial's org_id
  SELECT org_id INTO trial_org_id
  FROM public.trials
  WHERE id = trial_id_param;

  -- Staff with support enabled
  IF is_staff_with_support(trial_org_id) THEN
    RETURN TRUE;
  END IF;

  -- Org admin
  IF is_org_admin(trial_org_id) THEN
    RETURN TRUE;
  END IF;

  -- PI or CRC
  RETURN EXISTS (
    SELECT 1
    FROM public.trial_team_members
    WHERE trial_id = trial_id_param
    AND user_id = auth.uid()
    AND trial_role IN ('PI', 'CRC')
  );
END;
$$;

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_schedule_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_activity_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - USERS
-- ============================================================================

CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES - STAFF MEMBERS
-- ============================================================================

CREATE POLICY "staff_view_all" ON staff_members FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE user_id = auth.uid()));

-- ============================================================================
-- RLS POLICIES - ORGANIZATIONS
-- ============================================================================

CREATE POLICY "orgs_staff_view_all" ON organizations FOR SELECT
  USING (EXISTS (SELECT 1 FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "orgs_members_view" ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = organizations.id AND user_id = auth.uid() AND status = 'active'
    )
  );

CREATE POLICY "orgs_staff_insert" ON organizations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "orgs_staff_update" ON organizations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM staff_members WHERE user_id = auth.uid()));

CREATE POLICY "orgs_superadmin_update" ON organizations FOR UPDATE
  USING (is_org_superadmin(id));

-- ============================================================================
-- RLS POLICIES - ORGANIZATION MEMBERS
-- ============================================================================

CREATE POLICY "org_members_view" ON organization_members FOR SELECT
  USING (
    is_org_admin(org_id) OR is_staff_with_support(org_id) OR
    EXISTS (SELECT 1 FROM organization_members om WHERE om.org_id = organization_members.org_id AND om.user_id = auth.uid())
  );

CREATE POLICY "org_members_admin_insert" ON organization_members FOR INSERT
  WITH CHECK (is_org_admin(org_id) OR is_staff_with_support(org_id));

CREATE POLICY "org_members_admin_update" ON organization_members FOR UPDATE
  USING (is_org_admin(org_id) OR is_staff_with_support(org_id));

CREATE POLICY "org_members_superadmin_delete" ON organization_members FOR DELETE
  USING (is_org_superadmin(org_id) OR is_staff_with_support(org_id));

-- ============================================================================
-- RLS POLICIES - INVITATIONS
-- ============================================================================

CREATE POLICY "invitations_view" ON invitations FOR SELECT
  USING (is_org_admin(org_id) OR is_staff_with_support(org_id));

CREATE POLICY "invitations_insert" ON invitations FOR INSERT
  WITH CHECK (is_org_admin(org_id) OR is_staff_with_support(org_id));

CREATE POLICY "invitations_update" ON invitations FOR UPDATE
  USING (is_org_admin(org_id) OR is_staff_with_support(org_id));

-- ============================================================================
-- RLS POLICIES - TRIALS
-- ============================================================================

CREATE POLICY "trials_org_admin_view" ON trials FOR SELECT
  USING (is_org_admin(org_id) OR is_staff_with_support(org_id));

CREATE POLICY "trials_team_view" ON trials FOR SELECT
  USING (EXISTS (SELECT 1 FROM trial_team_members WHERE trial_id = trials.id AND user_id = auth.uid()));

CREATE POLICY "trials_admin_insert" ON trials FOR INSERT
  WITH CHECK (is_org_admin(org_id) OR is_staff_with_support(org_id));

CREATE POLICY "trials_admin_update" ON trials FOR UPDATE
  USING (is_org_admin(org_id) OR is_staff_with_support(org_id));

-- ============================================================================
-- RLS POLICIES - TRIAL TEAM MEMBERS
-- ============================================================================

CREATE POLICY "trial_team_view" ON trial_team_members FOR SELECT
  USING (has_trial_access(trial_id));

CREATE POLICY "trial_team_critical_insert" ON trial_team_members FOR INSERT
  WITH CHECK (has_critical_permission(trial_id));

CREATE POLICY "trial_team_critical_delete" ON trial_team_members FOR DELETE
  USING (has_critical_permission(trial_id));

-- ============================================================================
-- RLS POLICIES - VISIT TEMPLATES
-- ============================================================================

CREATE POLICY "visit_templates_view" ON visit_schedule_templates FOR SELECT
  USING (has_trial_access(trial_id));

CREATE POLICY "visit_templates_critical_insert" ON visit_schedule_templates FOR INSERT
  WITH CHECK (has_critical_permission(trial_id));

CREATE POLICY "visit_templates_critical_update" ON visit_schedule_templates FOR UPDATE
  USING (has_critical_permission(trial_id));

-- ============================================================================
-- RLS POLICIES - VISIT ACTIVITY TEMPLATES
-- ============================================================================

CREATE POLICY "activity_templates_view" ON visit_activity_templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM visit_schedule_templates vst
      WHERE vst.id = visit_activity_templates.visit_template_id AND has_trial_access(vst.trial_id)
    )
  );

CREATE POLICY "activity_templates_insert" ON visit_activity_templates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visit_schedule_templates vst
      WHERE vst.id = visit_activity_templates.visit_template_id AND has_critical_permission(vst.trial_id)
    )
  );

CREATE POLICY "activity_templates_update" ON visit_activity_templates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM visit_schedule_templates vst
      WHERE vst.id = visit_activity_templates.visit_template_id AND has_critical_permission(vst.trial_id)
    )
  );

-- ============================================================================
-- RLS POLICIES - PATIENTS
-- ============================================================================

CREATE POLICY "patients_view" ON patients FOR SELECT USING (has_trial_access(trial_id));
CREATE POLICY "patients_insert" ON patients FOR INSERT WITH CHECK (has_trial_access(trial_id));
CREATE POLICY "patients_update" ON patients FOR UPDATE USING (has_trial_access(trial_id));

-- ============================================================================
-- RLS POLICIES - VISITS
-- ============================================================================

CREATE POLICY "visits_view" ON visits FOR SELECT
  USING (EXISTS (SELECT 1 FROM patients p WHERE p.id = visits.patient_id AND has_trial_access(p.trial_id)));

CREATE POLICY "visits_insert" ON visits FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM patients p WHERE p.id = visits.patient_id AND has_trial_access(p.trial_id)));

CREATE POLICY "visits_update" ON visits FOR UPDATE
  USING (EXISTS (SELECT 1 FROM patients p WHERE p.id = visits.patient_id AND has_trial_access(p.trial_id)));

-- ============================================================================
-- RLS POLICIES - VISIT ACTIVITIES
-- ============================================================================

CREATE POLICY "visit_activities_view" ON visit_activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM visits v JOIN patients p ON p.id = v.patient_id
      WHERE v.id = visit_activities.visit_id AND has_trial_access(p.trial_id)
    )
  );

CREATE POLICY "visit_activities_insert" ON visit_activities FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visits v JOIN patients p ON p.id = v.patient_id
      WHERE v.id = visit_activities.visit_id AND has_trial_access(p.trial_id)
    )
  );

CREATE POLICY "visit_activities_update" ON visit_activities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM visits v JOIN patients p ON p.id = v.patient_id
      WHERE v.id = visit_activities.visit_id AND has_trial_access(p.trial_id)
    )
  );

-- ============================================================================
-- RLS POLICIES - TASKS
-- ============================================================================

CREATE POLICY "tasks_view_trial" ON tasks FOR SELECT USING (has_trial_access(trial_id));
CREATE POLICY "tasks_insert" ON tasks FOR INSERT WITH CHECK (has_trial_access(trial_id));
CREATE POLICY "tasks_update" ON tasks FOR UPDATE
  USING (has_trial_access(trial_id) AND (assigned_to = auth.uid() OR has_critical_permission(trial_id)));

-- ============================================================================
-- RLS POLICIES - DOCUMENTS
-- ============================================================================

CREATE POLICY "documents_view" ON documents FOR SELECT USING (has_trial_access(trial_id));
CREATE POLICY "documents_insert" ON documents FOR INSERT WITH CHECK (has_trial_access(trial_id));
CREATE POLICY "documents_update" ON documents FOR UPDATE USING (has_trial_access(trial_id));

-- ============================================================================
-- RLS POLICIES - MESSAGES
-- ============================================================================

CREATE POLICY "messages_view" ON messages FOR SELECT
  USING (
    has_trial_access(trial_id) AND
    (sent_by = auth.uid() OR EXISTS (SELECT 1 FROM message_participants WHERE message_id = messages.id AND user_id = auth.uid()))
  );

CREATE POLICY "messages_insert" ON messages FOR INSERT WITH CHECK (has_trial_access(trial_id));
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (sent_by = auth.uid());

-- ============================================================================
-- RLS POLICIES - MESSAGE PARTICIPANTS
-- ============================================================================

CREATE POLICY "message_participants_view" ON message_participants FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (SELECT 1 FROM messages m WHERE m.id = message_participants.message_id AND m.sent_by = auth.uid())
  );

CREATE POLICY "message_participants_insert" ON message_participants FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM messages m WHERE m.id = message_participants.message_id AND (m.sent_by = auth.uid() OR has_trial_access(m.trial_id)))
  );

CREATE POLICY "message_participants_update" ON message_participants FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - RESPONSE FOLDERS (Personal)
-- ============================================================================

CREATE POLICY "response_folders_view_own" ON response_folders FOR SELECT
  USING (user_id = auth.uid() AND has_trial_access(trial_id));

CREATE POLICY "response_folders_insert_own" ON response_folders FOR INSERT
  WITH CHECK (user_id = auth.uid() AND has_trial_access(trial_id));

CREATE POLICY "response_folders_update_own" ON response_folders FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - RESPONSE SNIPPETS (Personal)
-- ============================================================================

CREATE POLICY "response_snippets_view_own" ON response_snippets FOR SELECT
  USING (user_id = auth.uid() AND has_trial_access(trial_id));

CREATE POLICY "response_snippets_insert_own" ON response_snippets FOR INSERT
  WITH CHECK (user_id = auth.uid() AND has_trial_access(trial_id));

CREATE POLICY "response_snippets_update_own" ON response_snippets FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- RLS POLICIES - AUDIT LOGS (Read-only)
-- ============================================================================

CREATE POLICY "audit_logs_view" ON audit_logs FOR SELECT
  USING (is_org_admin(org_id) OR is_staff_with_support(org_id));
