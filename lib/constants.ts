/**
 * Application Constants
 * Centralized configuration for environment variables and business logic constants
 */

import { ROUTES } from "./routes";

// ============================================================================
// App URLs
// ============================================================================

export const APP_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ============================================================================
// SMTP / Email Configuration
// ============================================================================

export const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || "127.0.0.1",
  port: parseInt(process.env.SMTP_PORT || "54325", 10),
  secure: process.env.SMTP_SECURE === "true",
  from: process.env.SMTP_FROM || "noreply@themison.com",
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
// Resend Configuration
// ============================================================================

export const RESEND_CONFIG = {
  apiKey: process.env.RESEND_API_KEY || "",
  from: process.env.RESEND_FROM || "Themison App <noreply@themison.app>",
  // Use Resend if API key is configured
  useResend: Boolean(process.env.RESEND_API_KEY),
};

// ============================================================================
// Email Business Logic
// ============================================================================

export const EMAIL_CONFIG = {
  invitationExpiryDays: 7,
  brandName: "Themison",
  brandColor: "#000000",
  brandColorLight: "#333333",
};

// ============================================================================
// Business Logic Constants
// ============================================================================

/**
 * Patient-related constants
 */
export const PATIENT_CONSTANTS = {
  sex: ["male", "female", "other"] as const,
  status: [
    "screening",
    "enrolled",
    "completed",
    "withdrawn",
    "screen_failed",
  ] as const,
  autoCalculatedStatuses: ["screening", "enrolled", "completed"] as const,
  manualOnlyStatuses: ["withdrawn", "screen_failed"] as const,
} as const;

/**
 * Trial-related constants
 */
export const TRIAL_CONSTANTS = {
  phases: ["Phase I", "Phase II", "Phase III", "Phase IV"] as const,
  status: ["active", "paused", "completed", "terminated"] as const,
} as const;

/**
 * Task-related constants
 */
export const TASK_CONSTANTS = {
  status: ["todo", "in_progress", "completed", "blocked"] as const,
  priority: ["low", "medium", "high", "urgent"] as const,
} as const;

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
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === "production";

// ============================================================================
// RAG Backend Configuration
// ============================================================================

export const RAG_CONFIG = {
  apiUrl: process.env.RAG_API_URL || "https://core-backend-v2-improvements.onrender.com",
  apiKey: process.env.RAG_API_KEY || "",
  // Mock RAG processing when in development or when API URL is localhost
  isLocalMock:
    isDevelopment ||
    (process.env.RAG_API_URL || "").includes("localhost"),
  // Mock document for development (NODE_ENV=development)
  mockDocument: {
    id: "8d820eb8-bf60-4186-bfa5-9044d585d404",
    name: "Protocol_Ulcerative-Colitis.pdf",
  },
};
