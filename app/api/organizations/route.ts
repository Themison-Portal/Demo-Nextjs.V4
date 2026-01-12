/**
 * Organizations API Route
 * GET: List all organizations (staff only)
 * POST: Create new organization (staff only)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withStaffPermission } from '@/lib/middleware';

/**
 * GET /api/organizations
 * List all organizations (with mock data appended for development)
 */
export const GET = withStaffPermission(async (req, ctx, user) => {
  const supabase = await createClient();

  // Fetch organizations from database (RLS allows staff to see all)
  const { data: organizations, error } = await supabase
    .from('organizations')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[API] Error fetching organizations:', error);
    return Response.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }

  // Mock data for development (appended to real data)
  const mockOrganizations = [
    {
      id: 'mock-1',
      name: 'Mayo Clinic Research',
      slug: 'mayo-clinic-research',
      support_enabled: false,
      settings: {},
      created_at: new Date('2026-01-10').toISOString(),
      updated_at: new Date('2026-01-10').toISOString(),
      deleted_at: null,
      member_count: 24,
      trial_count: 8,
      active_trial_count: 8,
    },
    {
      id: 'mock-2',
      name: 'Cleveland Clinic Trials',
      slug: 'cleveland-clinic-trials',
      support_enabled: true,
      settings: {},
      created_at: new Date('2026-01-09').toISOString(),
      updated_at: new Date('2026-01-09').toISOString(),
      deleted_at: null,
      member_count: 18,
      trial_count: 5,
      active_trial_count: 5,
    },
    {
      id: 'mock-3',
      name: 'Johns Hopkins Research',
      slug: 'johns-hopkins-research',
      support_enabled: false,
      settings: {},
      created_at: new Date('2026-01-08').toISOString(),
      updated_at: new Date('2026-01-08').toISOString(),
      deleted_at: null,
      member_count: 31,
      trial_count: 12,
      active_trial_count: 12,
    },
  ];

  // Combine real + mock data
  const allOrganizations = [...(organizations || []), ...mockOrganizations];

  return Response.json({
    organizations: allOrganizations,
    total: allOrganizations.length,
  });
});

/**
 * POST /api/organizations
 * Create new organization
 */
export const POST = withStaffPermission(async (req: NextRequest, ctx, user) => {
  const body = await req.json();
  const {
    name,
    primary_owner_email,
    additional_owner_emails = [],
    features_enabled = [],
    support_enabled = false,
  } = body;

  // Validate required fields
  if (!name || !primary_owner_email) {
    return Response.json(
      { error: 'Missing required fields: name, primary_owner_email' },
      { status: 400 }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(primary_owner_email)) {
    return Response.json(
      { error: 'Invalid primary owner email' },
      { status: 400 }
    );
  }

  // Validate additional emails
  for (const email of additional_owner_emails) {
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: `Invalid additional owner email: ${email}` },
        { status: 400 }
      );
    }
  }

  const supabase = await createClient();

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  // Create organization (RLS allows staff to insert)
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      support_enabled,
      settings: {
        features_enabled: features_enabled.length > 0 ? features_enabled : ['all'],
      },
    })
    .select()
    .single();

  if (orgError) {
    console.error('[API] Error creating organization:', orgError);
    return Response.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }

  // TODO: Send invitation emails to owners
  // This will be implemented when we have email service
  // For now, just log the emails that would be sent
  console.log('[API] Invitation emails to send:', {
    primary: primary_owner_email,
    additional: additional_owner_emails,
    organization: organization.name,
  });

  return Response.json(organization, { status: 201 });
});
