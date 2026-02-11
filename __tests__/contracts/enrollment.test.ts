/**
 * Contract Tests — PATCH /api/client/[orgId]/trials/[trialId]/patients/[patientId]/enroll
 *
 * Tests enrollment endpoint through the full middleware chain:
 * withTrialMember (→ withOrgMember → withAuth) → handler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMockSupabase, type MockSupabase } from '../helpers/mock-supabase';
import { createRequest, createContext } from '../helpers/request';
import { IDS, MOCK_SUPABASE_USER, makeSamplePatient } from '../helpers/fixtures';
import { __setMockClient } from '../setup';

// Mock hydrateRemainingVisits to avoid importing complex service dependencies
vi.mock('@/services/visits/hydration', () => ({
  hydrateRemainingVisits: vi.fn(() =>
    Promise.resolve({ visits_created: 3, activities_created: 12 })
  ),
}));

import { PATCH } from '@/app/api/client/[orgId]/trials/[trialId]/patients/[patientId]/enroll/route';

const BASE_URL = `http://localhost:3000/api/client/${IDS.ORG}/trials/${IDS.TRIAL}/patients/${IDS.PATIENT}/enroll`;

describe('PATCH /api/client/[orgId]/trials/[trialId]/patients/[patientId]/enroll', () => {
  let mock: MockSupabase;

  beforeEach(() => {
    mock = createMockSupabase();
    __setMockClient(mock.client);
  });

  // Helper to set up middleware for admin with trial access
  function setupAdminTrialAccess() {
    mock
      .mockAuth(MOCK_SUPABASE_USER)
      .mockTable('organization_members', {
        data: { id: IDS.ORG_MEMBER, org_role: 'superadmin', status: 'active' },
        error: null,
      })
      // withTrialMember: trial exists
      .mockTable('trials', {
        data: { id: IDS.TRIAL, org_id: IDS.ORG },
        error: null,
      })
      // withTrialMember: admin trial role check
      .mockTable('trial_team_members', {
        data: { trial_role: 'PI' },
        error: null,
      });
  }

  // -----------------------------------------------------------------------
  // 1. Successful enrollment
  // -----------------------------------------------------------------------
  it('enrolls patient successfully with valid baseline_date', async () => {
    setupAdminTrialAccess();

    // Use future dates to avoid "cannot be in the past" validation
    const futureScreening = '2026-03-01';
    const futureBaseline = '2026-04-01';
    const futureDeadline = '2026-06-01';

    const patient = makeSamplePatient({
      screening_date: futureScreening,
      baseline_deadline_date: futureDeadline,
    });
    const enrolledPatient = {
      ...patient,
      status: 'enrolled',
      baseline_date: futureBaseline,
      enrollment_date: new Date().toISOString().split('T')[0],
    };

    // Handler: fetch patient, then update patient
    mock.mockTable('patients',
      { data: patient, error: null },
      { data: enrolledPatient, error: null },
    );

    const req = createRequest(BASE_URL, {
      method: 'PATCH',
      body: { baseline_date: futureBaseline },
    });
    const ctx = createContext({
      orgId: IDS.ORG,
      trialId: IDS.TRIAL,
      patientId: IDS.PATIENT,
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('enrolled');
    expect(body.baseline_date).toBe(futureBaseline);
    expect(body).toHaveProperty('hydration');
  });

  // -----------------------------------------------------------------------
  // 2. Patient not in screening → 400
  // -----------------------------------------------------------------------
  it('returns 400 when patient is not in screening status', async () => {
    setupAdminTrialAccess();

    const patient = makeSamplePatient({ status: 'enrolled' });

    mock.mockTable('patients', { data: patient, error: null });

    const req = createRequest(BASE_URL, {
      method: 'PATCH',
      body: { baseline_date: '2025-06-01' },
    });
    const ctx = createContext({
      orgId: IDS.ORG,
      trialId: IDS.TRIAL,
      patientId: IDS.PATIENT,
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('screening');
  });

  // -----------------------------------------------------------------------
  // 3. baseline_date before screening_date → 400
  // -----------------------------------------------------------------------
  it('returns 400 when baseline_date is before screening_date', async () => {
    setupAdminTrialAccess();

    const patient = makeSamplePatient({ screening_date: '2025-03-01' });

    mock.mockTable('patients', { data: patient, error: null });

    const req = createRequest(BASE_URL, {
      method: 'PATCH',
      body: { baseline_date: '2025-02-15' }, // before screening_date
    });
    const ctx = createContext({
      orgId: IDS.ORG,
      trialId: IDS.TRIAL,
      patientId: IDS.PATIENT,
    });
    const res = await PATCH(req, ctx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toContain('must be after screening_date');
  });
});
