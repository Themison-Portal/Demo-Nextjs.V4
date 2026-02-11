/**
 * Test Fixtures
 * Constant IDs and mock user objects for contract tests
 */

// Constant UUIDs for deterministic tests
export const IDS = {
  ORG: 'org-00000000-0000-0000-0000-000000000001',
  TRIAL: 'trial-0000-0000-0000-0000-000000000001',
  TRIAL_2: 'trial-0000-0000-0000-0000-000000000002',
  TASK: 'task-0000-0000-0000-0000-000000000001',
  TASK_2: 'task-0000-0000-0000-0000-000000000002',
  PATIENT: 'patient-00000000-0000-0000-000000000001',
  USER: 'user-0000-0000-0000-0000-000000000001',
  USER_2: 'user-0000-0000-0000-0000-000000000002',
  ORG_MEMBER: 'orgmem-0000-0000-0000-000000000001',
  ORG_MEMBER_2: 'orgmem-0000-0000-0000-000000000002',
  VISIT_ACTIVITY: 'va-00000000-0000-0000-0000-000000000001',
} as const;

// Mock JWT user returned by supabase.auth.getUser()
export const MOCK_SUPABASE_USER = {
  id: IDS.USER,
  email: 'admin@test.com',
  user_metadata: {
    first_name: 'Test',
    last_name: 'Admin',
    role: 'client', // not staff
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

export const MOCK_STAFF_USER = {
  id: IDS.USER_2,
  email: 'staff@themison.com',
  user_metadata: {
    first_name: 'Staff',
    last_name: 'User',
    role: 'staff',
  },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
};

// Sample task data as returned by Supabase query (raw, with nested joins)
export function makeSampleTask(overrides: Record<string, any> = {}) {
  return {
    id: IDS.TASK,
    trial_id: IDS.TRIAL,
    patient_id: IDS.PATIENT,
    visit_id: null,
    visit_activity_id: null,
    activity_type_id: null,
    category: null,
    title: 'Complete screening',
    description: null,
    status: 'todo',
    priority: 'medium',
    assigned_to: IDS.USER,
    due_date: '2025-03-01',
    source: 'manual',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    deleted_at: null,
    patients: { patient_number: 'P-001', initials: 'TA' },
    visits: null,
    trials: { id: IDS.TRIAL, name: 'Test Trial' },
    assigned_user: { id: IDS.USER, email: 'admin@test.com', full_name: 'Test Admin' },
    ...overrides,
  };
}

export function makeSamplePatient(overrides: Record<string, any> = {}) {
  return {
    id: IDS.PATIENT,
    trial_id: IDS.TRIAL,
    patient_number: 'P-001',
    initials: 'TA',
    date_of_birth: null,
    sex: null,
    enrollment_date: null,
    screening_date: '2025-01-15',
    baseline_date: null,
    baseline_deadline_date: '2025-04-15',
    status: 'screening',
    notes: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    deleted_at: null,
    ...overrides,
  };
}
