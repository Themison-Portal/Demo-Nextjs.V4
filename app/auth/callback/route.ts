/**
 * Auth Callback Route (PKCE Flow)
 * Handles email confirmation and auth callbacks for both staff and clinic users
 * Exchanges auth code for session and redirects to appropriate destination
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { ROUTES } from "@/lib/routes";

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
      console.error("No code provided in callback");
      return NextResponse.redirect(
        new URL(ROUTES.PUBLIC.ERROR_WITH_MESSAGE("No auth code"), requestUrl.origin)
      );
    }

    const supabase = await createClient();

    // Exchange code for session (PKCE flow)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL(ROUTES.PUBLIC.ERROR_WITH_MESSAGE(error.message), requestUrl.origin)
      );
    }

    // Get user to determine redirect based on email domain
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email ?? "";
    const userId = user?.id;

    // Determine redirect destination
    let redirectTo: string;

    if (email.endsWith("@themison.com")) {
      // Staff: redirect to console
      redirectTo = ROUTES.CONSOLE.HOME;
    } else {
      // Clinic user: redirect to their organization app
      // Get user's organization from organization_members
      const { data: membership } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .single();

      if (membership?.org_id) {
        redirectTo = ROUTES.APP.DASHBOARD(membership.org_id);
      } else {
        // Fallback: user has no organization yet (shouldn't happen in normal flow)
        redirectTo = ROUTES.PUBLIC.ERROR_WITH_MESSAGE("No organization found");
      }
    }

    return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
  } catch (error) {
    console.error("Unexpected error in auth callback:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
