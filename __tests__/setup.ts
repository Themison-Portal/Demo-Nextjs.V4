/**
 * Global Test Setup
 * Mocks next/headers and @/lib/supabase/server BEFORE any route import
 */

import { vi } from 'vitest';

// --------------------------------------------------------------------------
// Mock next/headers — cookies() returns a minimal store
// --------------------------------------------------------------------------

vi.mock('next/headers', () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      getAll: () => [],
      set: vi.fn(),
    })
  ),
  headers: vi.fn(() =>
    Promise.resolve(new Map())
  ),
}));

// --------------------------------------------------------------------------
// Mock next/server — provide NextRequest/NextResponse pass-through
// We re-export the real implementations so route code works unchanged
// --------------------------------------------------------------------------

// Note: next/server exports are used directly by route files.
// vitest resolves them fine in node env since Next.js ships CJS builds.

// --------------------------------------------------------------------------
// Mock @/lib/supabase/server — createClient() returns our mock
// The actual mock client is injected per-test via __setMockClient
// --------------------------------------------------------------------------

let _mockClient: any = null;

export function __setMockClient(client: any) {
  _mockClient = client;
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(_mockClient)),
}));

// --------------------------------------------------------------------------
// Mock @/lib/supabase/admin — prevent env var check at import time
// --------------------------------------------------------------------------

vi.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {},
}));
