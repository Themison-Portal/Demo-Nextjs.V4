/**
 * Auth Types
 * Shared interfaces for authentication operations
 */

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
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
  isStaff: boolean;
}
