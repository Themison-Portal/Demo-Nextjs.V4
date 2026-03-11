/**
 * Trial Types
 * Based on DB schema from initial_schema.sql
 */

// ============================================================================
// TRIAL
// ============================================================================

export type TrialPhase = 'Phase I' | 'Phase II' | 'Phase III' | 'Phase IV';
export type TrialStatus = 'active' | 'paused' | 'completed' | 'terminated';

/**
 * Trial settings stored in JSONB column
 * Used for flexible metadata without schema changes
 */
export interface TrialSettings {
    sponsor?: string;
    location?: string;
    // Future fields can be added here
    [key: string]: unknown;
}

export interface Trial {
    id: string;
    org_id: string;
    name: string;
    protocol_number?: string | null;
    phase?: TrialPhase | null;
    status: TrialStatus;
    start_date?: string | null;
    end_date?: string | null;
    description?: string | null;
    settings?: TrialSettings;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface TrialListItem extends Trial {
    // Computed fields from joins
    team_member_count?: number;
    patient_count?: number;
    principal_investigator?: {
        user_id: string;
        full_name?: string;
        email: string;
    } | null;
}

export interface TrialListResponse {
    trials: TrialListItem[];
    total: number;
}

// ============================================================================
// TRIAL TEAM MEMBER
// ============================================================================

export type TrialRole =
    | 'PI'
    | 'CRC'
    | 'Physician'
    | 'Nurse'
    | 'Data Manager'
    | 'Laboratory'
    | 'Pharmacist'
    | 'Monitor'
    | 'CR';

export interface TrialTeamMember {
    id: string;
    trial_id: string;
    org_member_id: string;
    trial_role: TrialRole;
    member_id: string;
    role_id: string;
    role_name?: string;
    assigned_at: string;
    assigned_by?: string | null;
    status?: 'active' | 'inactive';
    settings?: {
        notes?: string;
        contact_info?: string;
        [key: string]: unknown;
    };
    // From join with organization_members -> users
    user?: {
        id: string;
        email: string;
        full_name?: string;
        avatar_url?: string;
    };
}

// ============================================================================
// VISIT SCHEDULE TEMPLATE
// ============================================================================

export interface VisitScheduleTemplate {
    id: string;
    trial_id: string;
    visit_name: string;
    visit_order: number;
    days_from_start: number;
    window_before_days: number;
    window_after_days: number;
    description?: string | null;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
}

export interface VisitScheduleTemplateExtended extends VisitScheduleTemplate {
    name: string;
    order: number;
    is_day_zero: boolean;
    days_from_day_zero: number;
    window_before_days: number;
    window_after_days: number;
    activity_ids: string[];
    description?: string;
}


export interface VisitScheduleTemplateWithAssignees extends VisitScheduleTemplate {
    assignees?: { role: string; user_id: string }[];
}
// ============================================================================
// TRIAL DETAILS (Full object with relations)
// ============================================================================

export interface TrialDetails extends Trial {
    team_members: TrialTeamMember[];
    visit_schedules: VisitScheduleTemplate[];
    // Stats
    patient_count: number;
    active_patient_count: number;
    task_count: number;
    pending_task_count: number;
}

export interface TrialWithAssignmentsCreate {
    name: string;
    start_date?: string;
    members: { member_id: string; role_id: string }[];
    pending_members: { invitation_id: string; role_id: string }[];
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateTrialInput {
    name: string;
    protocol_number?: string;
    phase?: TrialPhase;
    start_date?: string;
    end_date?: string;
    description?: string;
}

export interface UpdateTrialInput {
    name?: string;
    protocol_number?: string;
    phase?: TrialPhase;
    status?: TrialStatus;
    start_date?: string | null;
    end_date?: string | null;
    description?: string;
    settings?: Partial<TrialSettings>;
}

export interface AddTrialTeamMemberInput {
    org_member_id: string;
    trial_role: TrialRole;
}

// ============================================================================
// TEAM MEMBER RESPONSE TYPES
// ============================================================================

export interface TeamMemberTrialInfo {
    trial_id: string;
    trial_name: string;
    trial_role: string;
}

export interface TeamMember {
    user_id: string;
    email: string;
    full_name?: string | null;
    trial_role: string; // Primary role (from first trial)
    trial_id: string; // Primary trial
    trial_name: string;
    trials: TeamMemberTrialInfo[]; // All trials this user is in
}

export interface TeamMembersResponse {
    team_members: TeamMember[];
}
