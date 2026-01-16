/**
 * Sign Out API Route
 * POST: Sign out user and redirect to signin
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Sign out from Supabase
    await supabase.auth.signOut();

    // Redirect to console signin
    // if coming from app -> redirect to /signin
    return NextResponse.redirect(new URL(ROUTES.CONSOLE.SIGNIN, request.url));
  } catch (error) {
    console.error("Error signing out:", error);
    return NextResponse.redirect(new URL(ROUTES.CONSOLE.SIGNIN, request.url));
  }
}
