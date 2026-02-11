/**
 * Contract Tests — GET /api/client/[orgId]/trials/[trialId]
 *
 * Tests trial detail endpoint through the full middleware chain:
 * withTrialMember (→ withOrgMember → withAuth) → handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockSupabase, type MockSupabase } from '../helpers/mock-supabase';
import { createRequest, createContext } from '../helpers/request';
import { IDS, MOCK_SUPABASE_USER } from '../helpers/fixtures';
import { __setMockClient } from '../setup';

import { GET } from '@/app/api/client/[orgId]/trials/[trialId]/route';

const BASE_URL = `http://localhost:3000/api/client/${IDS.ORG}/trials/${IDS.TRIAL}`;

describe('GET /api/client/[orgId]/trials/[trialId]', () => {
  let mock: MockSupabase;

  beforeEach(() => {
    mock = createMockSupabase();
    __setMockClient(mock.client);
  });

  // Helper to set up middleware tables for admin access
  function setupAdminAccess() {
    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'superadmin', status: 'active' },
        error: null,
      });
  }

  // -----------------------------------------------------------------------
  // 1. Returns trial with enriched data
  // -----------------------------------------------------------------------
  it('returns trial with team_members, patient_count, task_count', async () => {
    setupAdminAccess();

    const trialData = {
      id: IDS.TRIAL,
      org_id: IDS.ORG,
      name: 'Test Trial',
      status: 'active',
      phase: 'Phase 2',
      deleted_at: null,
    };

    const teamMembers = [
      {
        id: 'tm-1',
        trial_id: IDS.TRIAL,
        org_member_id: IDS.ORG_MEMBER,
        trial_role: 'PI',
        assigned_at: '2025-01-01',
        assigned_by: null,
        organization_members: {
          deleted_at: null,
          user: { id: IDS.USER, email: 'admin@test.com', full_name: 'Test Admin', avatar_url: null },
        },
      },
    ];

    // withTrialMember middleware: trials lookup
    mock.mockTable('trials',
      // First call: withTrialMember checks trial exists
      { data: { id: IDS.TRIAL, org_id: IDS.ORG }, error: null },
      // Second call: handler fetches trial detail
      { data: trialData, error: null },
    );

    // withTrialMember middleware: admin role check for trial assignment
    mock.mockTable('trial_team_members',
      // First call: withTrialMember checks if admin has trial role
      { data: { trial_role: 'PI' }, error: null },
      // Second call: handler fetches team members
      { data: teamMembers, error: null },
    );

    // patient counts (2 calls: total + active)
    mock.mockTable('patients',
      { data: null, error: null, count: 5 },
      { data: null, error: null, count: 3 },
    );

    // task counts (2 calls: total + pending)
    mock.mockTable('tasks',
      { data: null, error: null, count: 10 },
      { data: null, error: null, count: 7 },
    );

    const req = createRequest(BASE_URL);
    const ctx = createContext({ orgId: IDS.ORG, trialId: IDS.TRIAL });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.name).toBe('Test Trial');
    expect(body).toHaveProperty('team_members');
    expect(body.team_members).toHaveLength(1);
    expect(body.team_members[0]).toHaveProperty('user');
    expect(body).toHaveProperty('patient_count');
    expect(body).toHaveProperty('task_count');
  });

  // -----------------------------------------------------------------------
  // 2. Non-member gets 403
  // -----------------------------------------------------------------------
  it('returns 403 for non-member of the trial', async () => {
    mock
      .mockAuth(MOCK_SUPABASE_USER)
      // org member with editor role (non-admin)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'editor', status: 'active' },
        error: null,
      })
      // trial exists
      .mockTable('trials', {
        data: { id: IDS.TRIAL, org_id: IDS.ORG },
        error: null,
      })
      // user is NOT a member of this trial
      .mockTable('trial_team_members', {
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

    const req = createRequest(BASE_URL);
    const ctx = createContext({ orgId: IDS.ORG, trialId: IDS.TRIAL });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('Not a member');
  });

  // -----------------------------------------------------------------------
  // 3. Trial not found → 404
  // -----------------------------------------------------------------------
  it('returns 404 when trial does not exist', async () => {
    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'superadmin', status: 'active' },
        error: null,
      })
      // trial not found
      .mockTable('trials', {
        data: null,
        error: { code: 'PGRST116', message: 'not found' },
      });

    const req = createRequest(BASE_URL);
    const ctx = createContext({ orgId: IDS.ORG, trialId: 'nonexistent' });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toContain('not found');
  });
});
