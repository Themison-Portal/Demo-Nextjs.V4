/**
 * Application Routes
 * Centralized route definitions for type-safe navigation
 *
 * Usage:
 *   redirect(ROUTES.CONSOLE.SIGNIN)
 *   <Link href={ROUTES.CONSOLE.ORGANIZATION(id)}>
 */

// ============================================================================
// Console Routes (Staff/Admin)
// ============================================================================

export const CONSOLE_ROUTES = {
  /** Console home/dashboard */
  HOME: "/console",

  /** Staff sign in */
  SIGNIN: "/console/signin",

  /** Staff sign up */
  SIGNUP: "/console/signup",

  /** Organizations list */
  ORGANIZATIONS: "/console/organizations",

  /** Organization detail page */
  ORGANIZATION: (id: string) => `/console/organizations/${id}`,
} as const;

// ============================================================================
// App Routes (Client/Clinic)
// ============================================================================

export const APP_ROUTES = {
  /** Client dashboard */
  DASHBOARD: (orgId: string) => `/${orgId}/dashboard`,

  /** Client trials */
  TRIALS: (orgId: string) => `/${orgId}/trials`,

  /** Trial detail page */
  TRIAL: (orgId: string, trialId: string) => `/${orgId}/trials/${trialId}`,

  /** Client patients */
  PATIENTS: (orgId: string) => `/${orgId}/patients`,

  /** Client settings */
  SETTINGS: (orgId: string) => `/${orgId}/settings`,
} as const;

// ============================================================================
// Public Routes
// ============================================================================

export const PUBLIC_ROUTES = {
  /** Landing page */
  HOME: "/",

  /** Client signin */
  SIGNIN: "/signin",

  /** Client signup (with invitation token) */
  SIGNUP: "/signup",

  /** Error page */
  ERROR: "/error",

  /** Error page with message */
  ERROR_WITH_MESSAGE: (message: string) =>
    `/error?message=${encodeURIComponent(message)}`,
} as const;

// ============================================================================
// Auth Routes
// ============================================================================

export const AUTH_ROUTES = {
  /** OAuth/PKCE callback */
  CALLBACK: "/auth/callback",
} as const;

// ============================================================================
// External Routes
// ============================================================================

export const EXTERNAL_ROUTES = {
  /** Themison marketing website */
  WEBSITE: "https://www.themison.com/",

  /** Contact page */
  CONTACT: "https://www.themison.com/contact",
} as const;

// ============================================================================
// Unified Routes Object
// ============================================================================

/**
 * All application routes organized by section
 *
 * @example
 * ```tsx
 * import { ROUTES } from '@/lib/routes';
 *
 * // Simple routes
 * redirect(ROUTES.CONSOLE.SIGNIN);
 *
 * // Parameterized routes
 * <Link href={ROUTES.APP.DASHBOARD(orgId)}>
 *
 * // Error with message
 * redirect(ROUTES.PUBLIC.ERROR_WITH_MESSAGE('User not found'));
 * ```
 */
export const ROUTES = {
  CONSOLE: CONSOLE_ROUTES,
  APP: APP_ROUTES,
  PUBLIC: PUBLIC_ROUTES,
  AUTH: AUTH_ROUTES,
  EXTERNAL: EXTERNAL_ROUTES,
} as const;

// ============================================================================
// Type Exports (for type-safe route matching)
// ============================================================================

export type ConsoleRoute = typeof CONSOLE_ROUTES;
export type AppRoute = typeof APP_ROUTES;
export type PublicRoute = typeof PUBLIC_ROUTES;
export type AuthRoute = typeof AUTH_ROUTES;
export type ExternalRoute = typeof EXTERNAL_ROUTES;
