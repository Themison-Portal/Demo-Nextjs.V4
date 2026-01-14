/**
 * Application Constants
 * Centralized configuration for environment variables and business logic constants
 */

import { ROUTES } from "./routes";

// ============================================================================
// App URLs
// ============================================================================

export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ============================================================================
// SMTP / Email Configuration
// ============================================================================

export const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || '127.0.0.1',
  port: parseInt(process.env.SMTP_PORT || '54325', 10),
  secure: process.env.SMTP_SECURE === 'true',
  from: process.env.SMTP_FROM || 'noreply@themison.com',
  // Only include auth if credentials are provided (production)
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
};

// ============================================================================
// Email Business Logic
// ============================================================================

export const EMAIL_CONFIG = {
  invitationExpiryDays: 7,
  brandName: 'Themison',
  brandColor: '#000000',
  brandColorLight: '#333333',
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate invitation signup URL with token
 * @param token - Invitation token (hex-encoded)
 * @returns Full URL to signup page with token
 */
export const getInvitationUrl = (token: string): string =>
  `${APP_BASE_URL}${ROUTES.PUBLIC.SIGNUP}?token=${token}`;

/**
 * Check if running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === 'production';
