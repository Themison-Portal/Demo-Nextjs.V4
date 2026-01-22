export type PatientSex = 'male' | 'female' | 'other';
export type PatientStatus = 'screening' | 'enrolled' | 'completed' | 'withdrawn' | 'screen_failed';

export interface Patient {
  id: string;
  trial_id: string;
  patient_number: string;
  initials?: string | null;
  date_of_birth?: string | null;
  sex?: PatientSex | null;
  enrollment_date?: string | null;
  screening_date?: string | null;
  baseline_date?: string | null; // Day 0 / Randomization date
  baseline_deadline_date?: string | null; // Calculated enrollment deadline
  status: PatientStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface PatientListResponse {
  patients: Patient[];
  total: number;
}

export interface CreatePatientInput {
  patient_number: string;
  initials?: string;
  date_of_birth?: string;
  sex?: PatientSex;
  screening_date?: string;
  notes?: string;
}

export interface UpdatePatientInput {
  patient_number?: string;
  initials?: string | null;
  date_of_birth?: string | null;
  sex?: PatientSex | null;
  screening_date?: string | null;
  status?: PatientStatus;
  notes?: string | null;
}

export interface EnrollPatientInput {
  baseline_date: string; // Required: Day 0 date
  assignee_overrides?: Record<string, string | null>; // activity_id -> user_id (optional overrides)
}

// ============================================================================
// Enrollment Preview Types
// ============================================================================

export interface EnrollmentActivityPreview {
  activity_id: string;
  activity_name: string;
  assigned_to_role?: string | null;
  assigned_to_user_id?: string | null;
  assigned_to_user?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface EnrollmentVisitPreview {
  name: string;
  order: number;
  scheduled_date: string;
  days_from_day_zero: number;
  is_day_zero: boolean;
  activities: EnrollmentActivityPreview[];
}

export interface EnrollmentPreview {
  visits: EnrollmentVisitPreview[];
  total_visits: number;
  total_activities: number;
  baseline_date: string;
}
