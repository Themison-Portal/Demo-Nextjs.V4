/**
 * Auth Callback Route (PKCE Flow)
 * Handles email confirmation and auth callbacks for both staff and clinic users
 * Exchanges auth code for session and redirects to appropriate destination
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    const code = requestUrl.searchParams.get("code");

    if (!code) {
      console.error("No code provided in callback");
      return NextResponse.redirect(
        new URL("/error?message=No+auth+code", requestUrl.origin)
      );
    }

    const supabase = await createClient();

    // Exchange code for session (PKCE flow)
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Auth callback error:", error);
      return NextResponse.redirect(
        new URL(
          `/error?message=${encodeURIComponent(error.message)}`,
          requestUrl.origin
        )
      );
    }

    // Get user to determine redirect based on email domain
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const email = user?.email ?? "";

    // Redirect based on email domain
    const redirectTo = email.endsWith("@themison.com") ? "/console" : "/";

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
