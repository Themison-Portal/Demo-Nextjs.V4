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
  status: PatientStatus;
  visit_start_date?: string | null;
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
  enrollment_date?: string;
  visit_start_date?: string;
  notes?: string;
}

export interface UpdatePatientInput {
  patient_number?: string;
  initials?: string | null;
  date_of_birth?: string | null;
  sex?: PatientSex | null;
  enrollment_date?: string | null;
  status?: PatientStatus;
  visit_start_date?: string | null;
  notes?: string | null;
}
