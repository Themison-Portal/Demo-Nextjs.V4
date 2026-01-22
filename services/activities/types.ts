// ============================================================================
// Activity Types Catalog
// ============================================================================
// Global catalog of clinical trial activities.
// Shared across all trials for consistency and reusability.
// ============================================================================

export type ActivityCategory =
  | 'lab'
  | 'diagnostic'
  | 'nursing'
  | 'clinical'
  | 'admin'
  | 'pharmacy'
  | 'safety'
  | 'other';

export interface ActivityType {
  id: string; // 'blood_draw', 'ecg', etc.
  name: string; // 'Blood Draw', 'ECG', etc.
  category?: ActivityCategory | null;
  description?: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface ActivityCatalog {
  activities: ActivityType[];
  total: number;
  categories: ActivityCategory[];
}

export interface ActivityListResponse {
  activities: ActivityType[];
  total: number;
}

export interface CreateActivityTypeInput {
  id: string;
  name: string;
  category?: ActivityCategory;
  description?: string;
}

export interface UpdateActivityTypeInput {
  name?: string;
  category?: ActivityCategory | null;
  description?: string | null;
}

// ============================================================================
// Trial Activity Types (Trial-specific custom activities)
// ============================================================================

export interface TrialActivityType {
  id: string;
  trial_id: string;
  activity_id: string; // 'medical_history', 'randomization', etc.
  name: string;
  category?: ActivityCategory | null;
  description?: string | null;
  is_custom: boolean; // TRUE = custom, FALSE = copied from global
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TrialActivityListResponse {
  activities: TrialActivityType[];
  total: number;
}

export interface CreateTrialActivityInput {
  activity_id: string;
  name: string;
  category?: ActivityCategory;
  description?: string;
}

export interface UpdateTrialActivityInput {
  name?: string;
  category?: ActivityCategory | null;
  description?: string | null;
}

// ============================================================================
// Combined Activity Type (Global + Trial-specific)
// ============================================================================
// Used in UI to show both global boilerplate and trial custom activities

export interface ActivityMetadata {
  activity_id: string;
  name: string;
  category?: ActivityCategory | null;
  description?: string | null;
  source: 'global' | 'trial'; // Where it comes from
  is_custom?: boolean; // Only for trial activities
}
