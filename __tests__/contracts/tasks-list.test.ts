/**
 * Contract Tests — GET /api/client/[orgId]/tasks
 *
 * Tests the tasks list endpoint through the full middleware chain:
 * withOrgMember → handler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createMockSupabase, type MockSupabase } from '../helpers/mock-supabase';
import { createRequest, createContext } from '../helpers/request';
import {
  IDS,
  MOCK_SUPABASE_USER,
  makeSampleTask,
} from '../helpers/fixtures';
import { __setMockClient } from '../setup';

// Import the handler under test
import { GET } from '@/app/api/client/[orgId]/tasks/route';

const BASE_URL = `http://localhost:3000/api/client/${IDS.ORG}/tasks`;

describe('GET /api/client/[orgId]/tasks', () => {
  let mock: MockSupabase;

  beforeEach(() => {
    mock = createMockSupabase();
    __setMockClient(mock.client);
  });

  // -----------------------------------------------------------------------
  // 1. Admin gets all tasks
  // -----------------------------------------------------------------------
  it('returns all tasks for admin user', async () => {
    const tasks = [makeSampleTask(), makeSampleTask({ id: IDS.TASK_2, title: 'Second task' })];

    mock
      .mockAuth(MOCK_SUPABASE_USER)
      // withOrgMember: organization_members lookup
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'superadmin', status: 'active' },
        error: null,
      })
      // Handler: tasks query
      .mockTable('tasks', { data: tasks, error: null });

    const req = createRequest(BASE_URL);
    const ctx = createContext({ orgId: IDS.ORG });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.tasks).toHaveLength(2);
    expect(body.total).toBe(2);
    // Verify transform applied (nested patients → patient)
    expect(body.tasks[0]).toHaveProperty('patient');
    expect(body.tasks[0]).toHaveProperty('trial');
  });

  // -----------------------------------------------------------------------
  // 2. Non-admin gets filtered tasks by trial membership
  // -----------------------------------------------------------------------
  it('returns filtered tasks for non-admin based on trial membership', async () => {
    const assignedTask = makeSampleTask({ assigned_to: IDS.USER });
    const otherTask = makeSampleTask({
      id: IDS.TASK_2,
      assigned_to: IDS.USER_2,
      trial_id: IDS.TRIAL,
    });

    mock
      .mockAuth(MOCK_SUPABASE_USER)
      // withOrgMember: org member with editor role (non-admin)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'editor', status: 'active' },
        error: null,
      })
      // Handler: trial_team_members lookup (user has 'Monitor' role, not critical)
      .mockTable('trial_team_members', {
        data: [{ trial_id: IDS.TRIAL, trial_role: 'Monitor' }],
        error: null,
      })
      // Handler: tasks query (returns both tasks, filtering is post-query)
      .mockTable('tasks', { data: [assignedTask, otherTask], error: null });

    const req = createRequest(BASE_URL);
    const ctx = createContext({ orgId: IDS.ORG });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    // Monitor role: only sees tasks assigned to them
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].assigned_to).toBe(IDS.USER);
  });

  // -----------------------------------------------------------------------
  // 3. Query params respected (status filter)
  // -----------------------------------------------------------------------
  it('passes status filter to query', async () => {
    const todoTask = makeSampleTask({ status: 'todo' });

    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'admin', status: 'active' },
        error: null,
      })
      .mockTable('tasks', { data: [todoTask], error: null });

    const req = createRequest(`${BASE_URL}?status=todo`);
    const ctx = createContext({ orgId: IDS.ORG });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    // Verify .from('tasks') was called
    expect(mock.client.from).toHaveBeenCalledWith('tasks');
    expect(body.tasks).toHaveLength(1);
    expect(body.tasks[0].status).toBe('todo');
  });

  // -----------------------------------------------------------------------
  // 4. Unauthenticated → 401
  // -----------------------------------------------------------------------
  it('returns 401 for unauthenticated request', async () => {
    mock.mockUnauthenticated();
    __setMockClient(mock.client);

    const req = createRequest(BASE_URL);
    const ctx = createContext({ orgId: IDS.ORG });
    const res = await GET(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });
});
