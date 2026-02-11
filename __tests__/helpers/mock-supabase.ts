/**
 * Mock Supabase Client Factory
 * Creates a chainable mock that intercepts .from(), .rpc(), and .auth calls
 */

import { vi } from 'vitest';
import { MOCK_SUPABASE_USER } from './fixtures';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

interface TableResponse {
  data: any;
  error: any;
  count?: number | null;
}

interface MockSupabaseConfig {
  tables: Record<string, TableResponse[]>;
  rpcs: Record<string, TableResponse>;
  authUser: { data: { user: any }; error: any };
}

// --------------------------------------------------------------------------
// Factory
// --------------------------------------------------------------------------

export function createMockSupabase() {
  const config: MockSupabaseConfig = {
    tables: {},
    rpcs: {},
    authUser: {
      data: { user: MOCK_SUPABASE_USER },
      error: null,
    },
  };

  // Track call order per table to return different responses per call
  const callCounters: Record<string, number> = {};

  /**
   * Build a chainable query builder.
   * Every filter method (.eq, .is, .in, .gte, .order, .single, .select on update/insert)
   * is a no-op that returns itself. The terminal methods resolve the configured response.
   */
  function buildQueryBuilder(tableName: string): any {
    const counter = callCounters[tableName] ?? 0;
    callCounters[tableName] = counter + 1;

    const responses = config.tables[tableName] ?? [{ data: null, error: null }];
    const response = responses[Math.min(counter, responses.length - 1)];

    const builder: any = {};

    const chainMethods = [
      'select', 'insert', 'update', 'delete',
      'eq', 'neq', 'is', 'in', 'gte', 'lte', 'gt', 'lt',
      'like', 'ilike', 'not', 'or', 'filter',
      'order', 'limit', 'range', 'single', 'maybeSingle',
      'textSearch', 'match', 'contains', 'containedBy',
      'overlaps', 'csv',
    ];

    for (const method of chainMethods) {
      builder[method] = vi.fn().mockReturnValue(builder);
    }

    // Make builder thenable so `await query` resolves to the response
    builder.then = (resolve: (v: any) => void) => resolve(response);

    return builder;
  }

  const client = {
    from: vi.fn((tableName: string) => buildQueryBuilder(tableName)),

    rpc: vi.fn((fnName: string) => {
      const response = config.rpcs[fnName] ?? { data: null, error: null };
      return Promise.resolve(response);
    }),

    auth: {
      getUser: vi.fn(() => Promise.resolve(config.authUser)),
    },
  };

  // --------------------------------------------------------------------------
  // Config helpers (used in tests to set up scenarios)
  // --------------------------------------------------------------------------

  return {
    client,

    /** Configure what .from(tableName) returns. Pass an array for sequential calls. */
    mockTable(tableName: string, ...responses: TableResponse[]) {
      config.tables[tableName] = responses;
      // Reset call counter so next test starts fresh
      callCounters[tableName] = 0;
      return this;
    },

    /** Configure what .rpc(fnName) returns */
    mockRpc(fnName: string, response: TableResponse) {
      config.rpcs[fnName] = response;
      return this;
    },

    /** Configure auth.getUser() to return a specific user or error */
    mockAuth(user: any, error: any = null) {
      config.authUser = { data: { user }, error };
      return this;
    },

    /** Configure auth.getUser() to return an unauthenticated state */
    mockUnauthenticated() {
      config.authUser = { data: { user: null }, error: { message: 'Not authenticated' } };
      return this;
    },

    /** Reset all table call counters (call between tests in same describe) */
    resetCounters() {
      for (const key of Object.keys(callCounters)) {
        callCounters[key] = 0;
      }
      return this;
    },
  };
}

export type MockSupabase = ReturnType<typeof createMockSupabase>;
