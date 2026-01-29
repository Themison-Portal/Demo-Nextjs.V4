/**
 * Auth Guards for Layouts/Pages
 * Server-side helper functions to validate authentication in Server Components
 *
 * These guards centralize auth logic and prevent code duplication across layouts.
 * They use redirect() instead of Response (unlike API middleware).
 */

import { redirect } from "next/navigation";
import { getUser } from "./getUser";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";
import type { AuthUser } from "./getUser";

// ============================================================================
// Staff Guard
// ============================================================================

/**
 * Require staff authentication for layouts/pages
 * Redirects to signin if user is not authenticated or not staff
 *
 * @returns Authenticated staff user
 *
 * @example
 * // app/console/(protected)/layout.tsx
 * export default async function ConsoleLayout({ children }) {
 *   const user = await requireStaff();
 *   return <Shell user={user}>{children}</Shell>;
 * }
 */
export async function requireStaff(): Promise<AuthUser> {
  const user = await getUser();

  if (!user || !user.isStaff) {
    redirect(ROUTES.CONSOLE.SIGNIN);
  }

  return user;
}

// ============================================================================
// Organization Access Guard
// ============================================================================

export interface OrgAccessResult {
  user: AuthUser;
  org: {
    id: string;
    name: string;
    support_enabled: boolean;
  };
}

/**
 * Require organization access for layouts/pages
 * Validates that user can access the organization:
 * - Staff: requires support_enabled = true
 * - Clinic users: requires active membership
 *
 * @param orgId - Organization UUID
 * @returns User and organization data
 *
 * @example
 * // app/[orgId]/layout.tsx
 * export default async function OrgLayout({ children, params }) {
 *   const { orgId } = await params;
 *   const { user, org } = await requireOrgAccess(orgId);
 *   return <OrgProvider org={org}>{children}</OrgProvider>;
 * }
 */
export async function requireOrgAccess(orgId: string): Promise<OrgAccessResult> {
  const user = await getUser();

  if (!user) {
    redirect(ROUTES.PUBLIC.HOME);
  }

  const supabase = await createClient();

  // Staff users: require support_enabled
  if (user.isStaff) {
    const { data: org } = await supabase
      .from("organizations")
      .select("id, name, support_enabled")
      .eq("id", orgId)
      .is("deleted_at", null)
      .single();

    if (!org) {
      redirect(ROUTES.PUBLIC.ERROR_WITH_MESSAGE("Organization not found"));
    }

    if (!org.support_enabled) {
      redirect(ROUTES.PUBLIC.ERROR_WITH_MESSAGE("Support not enabled for this organization"));
    }

    return { user, org };
  }

  // Clinic users: require membership
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id, organizations!inner(id, name, support_enabled)")
    .eq("user_id", user.id)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!membership) {
    redirect(ROUTES.PUBLIC.ERROR_WITH_MESSAGE("Unauthorized"));
  }

  // Supabase returns organizations as array even with single relation
  const orgArray = membership.organizations as any;
  const org = (Array.isArray(orgArray) ? orgArray[0] : orgArray) as {
    id: string;
    name: string;
    support_enabled: boolean;
  };

  return {
    user,
    org,
  };
}

// ============================================================================
// Public Guard (optional - for consistency)
// ============================================================================

/**
 * Mark a layout/page as public (no authentication required)
 * This is a no-op function for consistency with other guards
 *
 * @example
 * // app/signup/layout.tsx
 * export default async function SignupLayout({ children }) {
 *   await requirePublic(); // Documents that this route is intentionally public
 *   return <div>{children}</div>;
 * }
 */
export async function requirePublic(): Promise<void> {
  // No-op: public routes don't need validation
  // This function exists for documentation and consistency
  return;
}
