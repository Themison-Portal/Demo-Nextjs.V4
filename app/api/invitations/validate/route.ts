/**
 * Invitation Validation API Route
 * GET /api/invitations/validate?token=XYZ
 * Validates invitation token and returns invitation details
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    // Validate token parameter
    if (!token) {
      return NextResponse.json(
        { error: 'Token parameter is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS (this is a public endpoint)
    const { data: invitation, error } = await supabaseAdmin
      .from('invitations')
      .select(`
        id,
        email,
        org_id,
        org_role,
        status,
        expires_at,
        created_at,
        organizations (
          id,
          name,
          slug
        )
      `)
      .eq('token', token)
      .single();

    if (error || !invitation) {
      console.error('[API] Error validating invitation:', error);
      console.log('[API] Token received:', token);
      console.log('[API] Invitation data:', invitation);
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    // Validate invitation status
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Invitation is no longer valid',
          details: `Invitation status: ${invitation.status}`
        },
        { status: 400 }
      );
    }

    // Validate expiration
    const expiresAt = new Date(invitation.expires_at);
    const now = new Date();

    if (expiresAt < now) {
      // Mark as expired
      await supabaseAdmin
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return NextResponse.json(
        { error: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', invitation.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'User already exists',
          details: 'This email is already registered'
        },
        { status: 409 }
      );
    }

    // Supabase returns organizations as array even with single relation
    const orgArray = invitation.organizations as any;
    const org = (Array.isArray(orgArray) ? orgArray[0] : orgArray) as {
      id: string;
      name: string;
      slug: string;
    } | null;

    // Return validated invitation details
    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        org_role: invitation.org_role,
        organization: org ? {
          id: org.id,
          name: org.name,
          slug: org.slug,
        } : null
      }
    });

  } catch (error) {
    console.error('[API] Error validating invitation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
