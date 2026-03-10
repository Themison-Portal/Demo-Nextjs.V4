/**
 * Organization Types
 */

import { OrgRole } from "@/lib/permissions/constants";

export interface OrganizationSettings {
    address?: string;
    [key: string]: unknown;
}

export interface Organization {
    id: string;
    name: string;
    slug?: string;
    support_enabled: boolean;
    settings?: OrganizationSettings;
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

export interface OrgMembership {
    userId: string;
    email: string;
    orgMemberId: string;
    orgRole: OrgRole;
    isStaff: boolean;
}

export interface OrganizationListResponse {
    organizations: Organization[];
    total: number;
}

export interface OrganizationMember {
    id: string; // org_member_id - used for trial_team_members
    user_id: string;
    org_id: string;
    org_role: 'superadmin' | 'admin' | 'editor' | 'reader';
    status: 'active' | 'pending' | 'inactive';
    joined_at: string;
    deleted_at?: string | null;
    user: {
        email: string;
        first_name?: string;
        last_name?: string;
        full_name?: string;
        avatar_url?: string;
    };
}

export interface Invitation {
    id: string;
    email: string;
    org_id: string;
    org_role: 'superadmin' | 'admin' | 'editor' | 'reader';
    status: 'pending' | 'accepted' | 'expired' | 'revoked';
    invited_by: string | null;
    token: string; // Secure token for invitation links
    expires_at: string;
    created_at: string;
    name?: string;
    initial_role: string; // Optional name for display purposes

}

export interface OrganizationDetails extends Organization {
    members: OrganizationMember[];
    invitations: Invitation[];
}

export interface UpdateOrganizationInput {
    name?: string;
    support_enabled?: boolean;
    settings?: Partial<OrganizationSettings>;
}

export interface AddMemberInput {
    email: string;
    org_role: 'superadmin' | 'admin' | 'editor' | 'reader';
}

export type Member = {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    org_role: string;
    deleted_at?: string | null;
};

// export type Invitation = {
//     id: string;
//     email: string;
//     initial_role: string;
//     status: string;
//     expires_at?: string | null;
//     name?: string;
// };
