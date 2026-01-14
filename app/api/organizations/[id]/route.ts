/**
 * Organization Details API Route
 * GET: Get organization by ID with members (staff only)
 * PATCH: Update organization (name, support_enabled) (staff only)
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withStaffPermission } from '@/lib/middleware';

/**
 * GET /api/organizations/[id]
 * Get organization details with members
 */
export const GET = withStaffPermission(async (req, ctx, user) => {
  const { id } = await ctx.params;
  const supabase = await createClient();

  // Fetch organization
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (orgError || !organization) {
    console.error('[API] Error fetching organization:', orgError);
    return Response.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }

  // Fetch members with user data
  const { data: members, error: membersError } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      org_id,
      org_role,
      status,
      joined_at,
      deleted_at,
      user:users (
        email,
        first_name,
        last_name,
        avatar_url
      )
    `)
    .eq('org_id', id)
    .is('deleted_at', null)
    .order('joined_at', { ascending: true });

  if (membersError) {
    console.error('[API] Error fetching members:', membersError);
    return Response.json(
      { error: 'Failed to fetch organization members' },
      { status: 500 }
    );
  }

  // Fetch pending invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from('invitations')
    .select('*')
    .eq('org_id', id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (invitationsError) {
    console.error('[API] Error fetching invitations:', invitationsError);
    return Response.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }

  return Response.json({
    ...organization,
    members: members || [],
    invitations: invitations || [],
  });
});

/**
 * PATCH /api/organizations/[id]
 * Update organization (name, support_enabled)
 */
export const PATCH = withStaffPermission(async (req: NextRequest, ctx, user) => {
  const { id } = await ctx.params;
  const body = await req.json();
  const { name, support_enabled } = body;

  // Validate at least one field is provided
  if (name === undefined && support_enabled === undefined) {
    return Response.json(
      { error: 'No fields to update' },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // Fetch current organization for audit log
  const { data: currentOrg, error: fetchError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !currentOrg) {
    return Response.json(
      { error: 'Organization not found' },
      { status: 404 }
    );
  }

  // Build update object
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (name !== undefined) {
    updates.name = name;
  }

  if (support_enabled !== undefined) {
    updates.support_enabled = support_enabled;
  }

  // Update organization
  const { data: updatedOrg, error: updateError } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('[API] Error updating organization:', updateError);
    return Response.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }

  // Audit log
  const changedFields: string[] = [];
  if (name !== undefined && name !== currentOrg.name) {
    changedFields.push('name');
  }
  if (support_enabled !== undefined && support_enabled !== currentOrg.support_enabled) {
    changedFields.push('support_enabled');
  }

  if (changedFields.length > 0) {
    await supabase.from('audit_logs').insert({
      action: 'organization.update',
      user_id: user.id,
      org_id: id,
      resource_type: 'organization',
      resource_id: id,
      before: {
        ...Object.fromEntries(changedFields.map(f => [f, currentOrg[f]])),
      },
      after: {
        ...Object.fromEntries(changedFields.map(f => [f, updatedOrg[f]])),
      },
    });
  }

  return Response.json(updatedOrg);
});
