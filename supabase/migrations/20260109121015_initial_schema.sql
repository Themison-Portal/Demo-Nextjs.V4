-- Themison Clinical Trials Management System
-- Initial Schema Migration

-- ============================================================================
-- AUTH TABLES
-- ============================================================================

-- Mirror of auth.users (all users in system)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Themison staff (@themison.com)
CREATE TABLE staff_members (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  hired_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  support_enabled BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Organization members (clinic users)
CREATE TABLE organization_members (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL CHECK (org_role IN ('superadmin', 'admin', 'editor', 'reader')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, org_id)
);

-- Track invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  org_role TEXT NOT NULL CHECK (org_role IN ('superadmin', 'admin', 'editor', 'reader')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TRIALS
-- ============================================================================

CREATE TABLE trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  protocol_number TEXT,
  phase TEXT CHECK (phase IN ('Phase I', 'Phase II', 'Phase III', 'Phase IV')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'terminated')),
  start_date DATE,
  end_date DATE,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Trial team members
CREATE TABLE trial_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trial_role TEXT NOT NULL, -- PI, CRC, Physician, Nurse, Lab Technician, or custom
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE(trial_id, user_id)
);

-- Visit schedule templates (per trial)
CREATE TABLE visit_schedule_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  visit_name TEXT NOT NULL, -- "Screening", "Baseline", "Week 4", etc.
  visit_order INTEGER NOT NULL,
  days_from_start INTEGER NOT NULL, -- 0 for baseline, 7 for week 1, etc.
  window_before_days INTEGER DEFAULT 0,
  window_after_days INTEGER DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(trial_id, visit_order)
);

-- Activities within visit templates
CREATE TABLE visit_activity_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_template_id UUID NOT NULL REFERENCES visit_schedule_templates(id) ON DELETE CASCADE,
  activity_name TEXT NOT NULL, -- "Blood Draw", "Vital Signs", "ECG", etc.
  activity_order INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- PATIENTS
-- ============================================================================

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  patient_number TEXT NOT NULL, -- Trial-specific patient ID
  initials TEXT,
  date_of_birth DATE,
  sex TEXT CHECK (sex IN ('male', 'female', 'other')),
  enrollment_date DATE,
  status TEXT DEFAULT 'screening' CHECK (status IN ('screening', 'enrolled', 'completed', 'withdrawn', 'screen_failed')),
  visit_start_date DATE, -- When patient starts visit schedule
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(trial_id, patient_number)
);

-- ============================================================================
-- VISITS (Generated from templates)
-- ============================================================================

CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  visit_template_id UUID REFERENCES visit_schedule_templates(id) ON DELETE SET NULL,
  visit_name TEXT NOT NULL,
  visit_order INTEGER NOT NULL,
  scheduled_date DATE NOT NULL,
  actual_date DATE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities within patient visits
CREATE TABLE visit_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  activity_template_id UUID REFERENCES visit_activity_templates(id) ON DELETE SET NULL,
  activity_name TEXT NOT NULL,
  activity_order INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'not_applicable')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  cc_users UUID[] DEFAULT '{}', -- Array of user IDs
  due_date DATE,
  completed_at TIMESTAMPTZ,
  source TEXT CHECK (source IN ('manual', 'visit', 'response')), -- Where task was created
  source_id UUID, -- ID of visit or response that created task
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- DOCUMENTS
-- ============================================================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE, -- NULL for trial-level docs
  visit_id UUID REFERENCES visits(id) ON DELETE CASCADE, -- NULL for patient or trial docs
  visit_activity_id UUID REFERENCES visit_activities(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  category TEXT CHECK (category IN ('protocol', 'icf', 'amendment', 'patient_consent', 'lab_result', 'visit_document', 'other')),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  rag_indexed BOOLEAN DEFAULT false, -- Whether indexed for Document Assistant
  rag_indexed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- COMMUNICATION HUB
-- ============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  parent_message_id UUID REFERENCES messages(id) ON DELETE CASCADE, -- For replies
  sent_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Message participants (To/CC)
CREATE TABLE message_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant_type TEXT NOT NULL CHECK (participant_type IN ('to', 'cc')),
  read_at TIMESTAMPTZ,
  UNIQUE(message_id, user_id)
);

-- ============================================================================
-- RESPONSE ARCHIVE (RAG saved responses)
-- ============================================================================

CREATE TABLE response_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE response_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES response_folders(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  question TEXT NOT NULL, -- Original query
  response TEXT NOT NULL, -- AI response
  document_ids UUID[] DEFAULT '{}', -- Documents queried
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================================
-- AUDIT LOGS (Immutable)
-- ============================================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- e.g., 'task.create', 'patient.delete'
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trial_id UUID REFERENCES trials(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'task', 'patient', 'document', etc.
  resource_id UUID NOT NULL,
  before JSONB, -- State before mutation
  after JSONB, -- State after mutation
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_email ON users(email);

-- Organizations
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at);

-- Organization members
CREATE INDEX idx_org_members_org_id ON organization_members(org_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);

-- Invitations
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_org_id ON invitations(org_id);
CREATE INDEX idx_invitations_status ON invitations(status);

-- Trials
CREATE INDEX idx_trials_org_id ON trials(org_id);
CREATE INDEX idx_trials_deleted_at ON trials(deleted_at);
CREATE INDEX idx_trials_status ON trials(status);

-- Trial team members
CREATE INDEX idx_trial_team_trial_id ON trial_team_members(trial_id);
CREATE INDEX idx_trial_team_user_id ON trial_team_members(user_id);

-- Visit templates
CREATE INDEX idx_visit_templates_trial_id ON visit_schedule_templates(trial_id);
CREATE INDEX idx_visit_templates_deleted_at ON visit_schedule_templates(deleted_at);

-- Patients
CREATE INDEX idx_patients_trial_id ON patients(trial_id);
CREATE INDEX idx_patients_deleted_at ON patients(deleted_at);
CREATE INDEX idx_patients_status ON patients(status);

-- Visits
CREATE INDEX idx_visits_patient_id ON visits(patient_id);
CREATE INDEX idx_visits_scheduled_date ON visits(scheduled_date);
CREATE INDEX idx_visits_status ON visits(status);

-- Visit activities
CREATE INDEX idx_visit_activities_visit_id ON visit_activities(visit_id);
CREATE INDEX idx_visit_activities_status ON visit_activities(status);

-- Tasks
CREATE INDEX idx_tasks_trial_id ON tasks(trial_id);
CREATE INDEX idx_tasks_patient_id ON tasks(patient_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Documents
CREATE INDEX idx_documents_trial_id ON documents(trial_id);
CREATE INDEX idx_documents_patient_id ON documents(patient_id);
CREATE INDEX idx_documents_visit_id ON documents(visit_id);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_rag_indexed ON documents(rag_indexed);

-- Messages
CREATE INDEX idx_messages_trial_id ON messages(trial_id);
CREATE INDEX idx_messages_sent_by ON messages(sent_by);
CREATE INDEX idx_messages_parent_id ON messages(parent_message_id);
CREATE INDEX idx_messages_deleted_at ON messages(deleted_at);

-- Message participants
CREATE INDEX idx_message_participants_user_id ON message_participants(user_id);
CREATE INDEX idx_message_participants_message_id ON message_participants(message_id);

-- Response folders
CREATE INDEX idx_response_folders_user_id ON response_folders(user_id);
CREATE INDEX idx_response_folders_trial_id ON response_folders(trial_id);
CREATE INDEX idx_response_folders_deleted_at ON response_folders(deleted_at);

-- Response snippets
CREATE INDEX idx_response_snippets_user_id ON response_snippets(user_id);
CREATE INDEX idx_response_snippets_trial_id ON response_snippets(trial_id);
CREATE INDEX idx_response_snippets_folder_id ON response_snippets(folder_id);
CREATE INDEX idx_response_snippets_deleted_at ON response_snippets(deleted_at);

-- Audit logs
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_trial_id ON audit_logs(trial_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-sync auth.users → users table
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Always create user mirror
  INSERT INTO users (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- If @themison.com AND email confirmed → create staff
  IF NEW.email LIKE '%@themison.com' AND NEW.email_confirmed_at IS NOT NULL THEN
    INSERT INTO staff_members (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
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
