/**
 * Organization Types
 */

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  support_enabled: boolean;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Computed fields (from joins or counts)
  member_count?: number;
  trial_count?: number;
  active_trial_count?: number;
}

export interface CreateOrganizationInput {
  name: string;
  primary_owner_email: string;
  additional_owner_emails?: string[];
  features_enabled?: string[];
  support_enabled?: boolean;
}

export interface OrganizationListResponse {
  organizations: Organization[];
  total: number;
}
