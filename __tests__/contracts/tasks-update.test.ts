/**
 * Contract Tests — PATCH /api/client/[orgId]/tasks/[taskId]
 *
 * Tests task update through the full middleware chain:
 * withOrgMember → handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockSupabase, type MockSupabase } from '../helpers/mock-supabase';
import { createRequest, createContext } from '../helpers/request';
import { IDS, MOCK_SUPABASE_USER } from '../helpers/fixtures';
import { __setMockClient } from '../setup';

import { PATCH } from '@/app/api/client/[orgId]/tasks/[taskId]/route';

const BASE_URL = `http://localhost:3000/api/client/${IDS.ORG}/tasks/${IDS.TASK}`;

describe('PATCH /api/client/[orgId]/tasks/[taskId]', () => {
  let mock: MockSupabase;

  beforeEach(() => {
    mock = createMockSupabase();
    __setMockClient(mock.client);
  });

  // -----------------------------------------------------------------------
  // 1. Admin updates any task
  // -----------------------------------------------------------------------
  it('allows admin to update any task', async () => {
    const existingTask = {
      id: IDS.TASK,
      trial_id: IDS.TRIAL,
      assigned_to: IDS.USER_2,
      visit_activity_id: null,
    };
    const updatedTask = { ...existingTask, status: 'in_progress' };

    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'superadmin', status: 'active' },
        error: null,
      })
      // tasks: first call = fetch existing, second call = update
      .mockTable('tasks',
        { data: existingTask, error: null },
        { data: updatedTask, error: null },
      );

    const req = createRequest(BASE_URL, {
      method: 'PATCH',
      body: { status: 'in_progress' },
    });
    const ctx = createContext({ orgId: IDS.ORG, taskId: IDS.TASK });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('in_progress');
  });

  // -----------------------------------------------------------------------
  // 2. Non-PI/CRC can't update unassigned task
  // -----------------------------------------------------------------------
  it('returns 403 when non-critical role tries to update unassigned task', async () => {
    const existingTask = {
      id: IDS.TASK,
      trial_id: IDS.TRIAL,
      assigned_to: IDS.USER_2, // assigned to someone else
      visit_activity_id: null,
    };

    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'editor', status: 'active' },
        error: null,
      })
      // tasks: fetch existing task
      .mockTable('tasks', { data: existingTask, error: null })
      // trial_team_members: user has Monitor role (not critical)
      .mockTable('trial_team_members', {
        data: { trial_role: 'Monitor' },
        error: null,
      });

    const req = createRequest(BASE_URL, {
      method: 'PATCH',
      body: { status: 'completed' },
    });
    const ctx = createContext({ orgId: IDS.ORG, taskId: IDS.TASK });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toContain('only update tasks assigned to you');
  });

  // -----------------------------------------------------------------------
  // 3. Completing task syncs visit_activity
  // -----------------------------------------------------------------------
  it('auto-completes visit_activity when task is completed', async () => {
    const existingTask = {
      id: IDS.TASK,
      trial_id: IDS.TRIAL,
      assigned_to: IDS.USER,
      visit_activity_id: IDS.VISIT_ACTIVITY,
    };
    const updatedTask = { ...existingTask, status: 'completed' };

    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'superadmin', status: 'active' },
        error: null,
      })
      .mockTable('tasks',
        { data: existingTask, error: null },
        { data: updatedTask, error: null },
      )
      .mockTable('visit_activities', { data: null, error: null });

    const req = createRequest(BASE_URL, {
      method: 'PATCH',
      body: { status: 'completed' },
    });
    const ctx = createContext({ orgId: IDS.ORG, taskId: IDS.TASK });
    const res = await PATCH(req, ctx);

    expect(res.status).toBe(200);
    // Verify visit_activities table was touched
    expect(mock.client.from).toHaveBeenCalledWith('visit_activities');
  });
});
