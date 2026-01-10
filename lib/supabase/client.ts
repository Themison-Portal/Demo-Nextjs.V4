/**
 * Supabase Browser Client
 * Use this in Client Components and hooks
 * Handles user sessions via cookies (synced with server)
 */

"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
