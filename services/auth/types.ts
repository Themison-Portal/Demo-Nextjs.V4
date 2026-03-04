/**
 * Auth Types
 * Shared interfaces for authentication operations
 */

export interface SignupData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'staff' | 'member'; // Optional: defaults to 'staff' for @themison.com users
}

export interface SignupResponse {
    success: boolean;
    userId?: string;
    message?: string;
}

export interface SigninData {
    email: string;
    password: string;
}

export interface SigninResponse {
    success: boolean;
    userId?: string;
    message?: string;
}

export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    organizationId?: string;
    organizationName?: string;
    role?: 'staff' | 'member';
    onboardingCompleted?: boolean;
    isStaff: boolean;
}
