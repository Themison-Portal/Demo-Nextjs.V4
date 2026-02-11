/**
 * Contract Tests — GET /api/client/[orgId]/dashboard/stats
 *
 * Tests the dashboard stats endpoint through the full middleware chain:
 * withOrgMember → handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockSupabase, type MockSupabase } from '../helpers/mock-supabase';
import { createRequest, createContext } from '../helpers/request';
import { IDS, MOCK_SUPABASE_USER } from '../helpers/fixtures';
import { __setMockClient } from '../setup';

import { GET } from '@/app/api/client/[orgId]/dashboard/stats/route';

const BASE_URL = `http://localhost:3000/api/client/${IDS.ORG}/dashboard/stats`;

describe('GET /api/client/[orgId]/dashboard/stats', () => {
  let mock: MockSupabase;

  beforeEach(() => {
    mock = createMockSupabase();
    __setMockClient(mock.client);
  });

  // -----------------------------------------------------------------------
  // 1. Returns complete stats shape
  // -----------------------------------------------------------------------
  it('returns complete stats with trials, patients, tasks, teamMembers, timeline', async () => {
    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'admin', status: 'active' },
        error: null,
      })
      // trials
      .mockTable('trials', {
        data: [
          { id: IDS.TRIAL, status: 'active' },
          { id: IDS.TRIAL_2, status: 'paused' },
        ],
        error: null,
      })
      // patients
      .mockTable('patients', {
        data: [
          { id: 'p1', status: 'screening' },
          { id: 'p2', status: 'enrolled' },
        ],
        error: null,
      })
      // tasks
      .mockTable('tasks', {
        data: [
          {
            id: 't1',
            status: 'todo',
            due_date: null,
            assigned_to: IDS.USER,
            assigned_user: { id: IDS.USER, full_name: 'Test Admin' },
          },
          {
            id: 't2',
            status: 'completed',
            due_date: '2025-01-01',
            assigned_to: null,
            assigned_user: null,
          },
        ],
        error: null,
      })
      // organization_members count (second call after middleware)
      // The middleware call and the handler call both hit organization_members
      // Middleware uses first response, handler uses second
      // But since both are 'organization_members', we need to handle ordering
      // Actually: withOrgMember already consumed one response.
      // The handler queries organization_members again for team count.
      // We already set one response above for middleware.
      // The mock returns the last configured response for subsequent calls.
      // visits
      .mockTable('visits', { data: [], error: null });

    const req = createRequest(BASE_URL);
    const ctx = createContext({ orgId: IDS.ORG });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);

    // Verify top-level shape
    expect(body).toHaveProperty('trials');
    expect(body).toHaveProperty('patients');
    expect(body).toHaveProperty('tasks');
    expect(body).toHaveProperty('teamMembers');
    expect(body).toHaveProperty('timeline');

    // Verify nested shape
    expect(body.trials).toHaveProperty('total');
    expect(body.trials).toHaveProperty('byStatus');
    expect(body.patients).toHaveProperty('total');
    expect(body.patients).toHaveProperty('byStatus');
    expect(body.tasks).toHaveProperty('total');
    expect(body.tasks).toHaveProperty('byStatus');
    expect(body.tasks).toHaveProperty('overdue');
    expect(body.tasks).toHaveProperty('byAssignee');
    expect(body.teamMembers).toHaveProperty('total');
    expect(Array.isArray(body.timeline)).toBe(true);
  });

  // -----------------------------------------------------------------------
  // 2. Empty org returns zero-state
  // -----------------------------------------------------------------------
  it('returns zero-state stats for empty org', async () => {
    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members',
        // Middleware call
        { data: { id: IDS.ORG_MEMBER, org_role: 'admin', status: 'active' }, error: null },
        // Handler: team member count
        { data: null, error: null, count: 0 },
      )
      .mockTable('trials', { data: [], error: null })
      .mockTable('patients', { data: [], error: null })
      .mockTable('tasks', { data: [], error: null })
      .mockTable('visits', { data: [], error: null });

    const req = createRequest(BASE_URL);
    const ctx = createContext({ orgId: IDS.ORG });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.trials.total).toBe(0);
    expect(body.patients.total).toBe(0);
    expect(body.tasks.total).toBe(0);
    expect(body.tasks.overdue).toBe(0);
    expect(body.tasks.byAssignee).toEqual([]);
  });
});
