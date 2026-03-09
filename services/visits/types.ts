// ============================================================================
// Visit Template Types (JSONB structure)
// ============================================================================

export interface VisitScheduleTemplate {
    version: number;
    visits: VisitTemplate[];
    assignees: Record<string, string>; // activity_id -> role (e.g. 'blood_draw' -> 'Laboratory')
}

export interface VisitTemplate {
    name: string; // "Screening", "Baseline", "Week 2", etc.
    order: number; // 1, 2, 3...
    days_from_day_zero: number; // Can be negative! (e.g. -14 for screening)
    is_day_zero: boolean; // Exactly ONE visit must be true
    window_before_days: number; // Visit window tolerance (days before)
    window_after_days: number; // Visit window tolerance (days after)
    activity_ids: string[]; // ['blood_draw', 'ecg', etc.]
    description?: string;
}

// ============================================================================
// Database Record Types
// ============================================================================

export type VisitStatus =
    | 'scheduled'    // Initial state after creation
    | 'rescheduled'  // Visit date was changed
    | 'completed'    // Visit finished successfully
    | 'incompleted'  // Visit happened but not all activities completed
    | 'suspended'    // Visit temporarily on hold
    | 'missed'       // Patient didn't show up
    | 'cancelled';   // Visit cancelled

export const VISIT_STATUSES: VisitStatus[] = [
    'scheduled',
    'rescheduled',
    'completed',
    'incompleted',
    'suspended',
    'missed',
    'cancelled',
];

export interface Visit {
    id: string;
    patient_id: string;
    visit_template_id?: string | null;
    visit_template_name?: string | null; // Copied from template (preserved if template deleted)
    visit_name: string;
    visit_order: number;
    days_from_day_zero?: number | null;
    is_day_zero?: boolean;
    scheduled_date: string; // DATE
    actual_date?: string | null; // DATE
    status: VisitStatus;
    notes?: string | null;
    created_at: string;
    updated_at: string;
}

export type VisitActivityStatus = 'pending' | 'completed' | 'not_applicable';

export interface VisitActivity {
    id: string;
    visit_id: string;
    activity_template_id?: string | null;
    activity_type_id?: string | null; // FK to activity_types
    activity_name: string;
    activity_order: number;
    status: VisitActivityStatus;
    completed_at?: string | null;
    completed_by?: string | null; // user_id
    notes?: string | null;
    clinical_data?: Record<string, any> | null; // JSONB: checklists, lab results, vitals, etc.
    created_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface HydrationResult {
    visits_created: number;
    activities_created: number;
    tasks_created: number;
    patient_id: string;
    trial_id: string;
}

export interface RecalculationResult {
    visits_updated: number;
    tasks_updated: number;
    patient_id: string;
    new_visit_start_date: string;
}

export interface VisitListResponse {
    visits: Visit[];
    total: number;
}

export interface VisitWithActivities extends Visit {
    activities: VisitActivity[];
}

// ============================================================================
// Input Types
// ============================================================================

export interface CreateVisitTemplateInput {
    version?: number;
    visits: Omit<VisitTemplate, 'order'>[];
    assignees: Record<string, string>;
}

export interface UpdateVisitTemplateInput {
    version?: number;
    visits: VisitTemplate[];
    assignees: Record<string, string>;
}

export type PatientVisitStatus = "scheduled" | "in_progress" | "completed";

export interface PatientVisit {
    id: string;                     // visit UUID
    trial_id: string;               // associated trial
    patient_id: string;             // associated patient
    visit_name?: string;            // optional name/title of the visit
    visit_type?: string;            // optional type
    status: PatientVisitStatus;     // visit status
    planned_date?: string;          // ISO string, planned date of visit
    actual_date?: string;           // ISO string, actual date of visit
    created_at: string;             // ISO string
    updated_at: string;             // ISO string
    activities?: VisitActivity[];   // optional array of activities
}
