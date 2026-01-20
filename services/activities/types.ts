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
