/**
 * Client - Trials API Route
 * GET: List trials for organization
 * POST: Create new trial
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgPermission, withOrgMember } from "@/lib/api/middleware";
import { isAdminRole } from "@/lib/permissions/constants";
import { TRIAL_CONSTANTS } from "@/lib/constants";

/**
 * GET /api/client/[orgId]/trials
 * Get trials for an organization
 *
 * Access:
 * - superadmin/admin: See ALL trials in the organization
 * - editor/reader: See only trials where they are assigned (via trial_team_members)
 * - staff (with support_enabled): See ALL trials
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Determine if user can see all trials
  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  // Build query
  let query = supabase
    .from("trials")
    .select(`
      *,
      trial_team_members (
        id,
        trial_role,
        org_member_id,
        organization_members:org_member_id (
          deleted_at,
          user:user_id (
            id,
            email,
            full_name
          )
        )
      )
    `)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // If editor/reader, filter to only assigned trials
  if (!canViewAll) {
    // Get trial IDs where user is a team member
    const { data: memberTrials, error: memberError } = await supabase
      .from("trial_team_members")
      .select("trial_id")
      .eq("org_member_id", user.orgMemberId);

    // DEBUG: Log for troubleshooting
    console.log("[API] Editor/Reader trial access check:", {
      userId: user.id,
      orgMemberId: user.orgMemberId,
      orgRole: user.orgRole,
      memberTrials,
      memberError,
    });

    const trialIds = (memberTrials || []).map((m) => m.trial_id);

    if (trialIds.length === 0) {
      // No assigned trials
      return Response.json({ trials: [], total: 0 });
    }

    query = query.in("id", trialIds);
  }

  const { data: trials, error: trialsError } = await query;

  if (trialsError) {
    console.error("[API] Error fetching trials:", trialsError);
    return Response.json({ error: "Failed to fetch trials" }, { status: 500 });
  }

  // Transform to include computed fields
  const transformedTrials = (trials || []).map((trial) => {
    // Filter out team members whose org membership was deleted
    const teamMembers = (trial.trial_team_members || []).filter(
      (m: any) => m.organization_members?.deleted_at === null
    );

    // Find PI (Principal Investigator)
    const piMember = teamMembers.find((m: any) => m.trial_role === 'PI');
    const piUser = piMember?.organization_members?.user;

    return {
      id: trial.id,
      org_id: trial.org_id,
      name: trial.name,
      protocol_number: trial.protocol_number,
      phase: trial.phase,
      status: trial.status,
      start_date: trial.start_date,
      end_date: trial.end_date,
      description: trial.description,
      settings: trial.settings,
      created_at: trial.created_at,
      updated_at: trial.updated_at,
      team_member_count: teamMembers.length,
      principal_investigator: piUser ? {
        user_id: piUser.id,
        full_name: piUser.full_name,
        email: piUser.email,
      } : null,
    };
  });

  return Response.json({
    trials: transformedTrials,
    total: transformedTrials.length,
  });
});

/**
 * POST /api/client/[orgId]/trials
 * Create a new trial
 * Allows: superadmin, admin of org, or staff with support_enabled
 */
export const POST = withOrgPermission(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { name, protocol_number, phase, start_date, end_date, description } = body;

  // Validate required fields
  if (!name || typeof name !== "string" || name.trim() === "") {
    return Response.json({ error: "Trial name is required" }, { status: 400 });
  }

  // Validate phase if provided
  if (phase && !TRIAL_CONSTANTS.phases.includes(phase)) {
    return Response.json({ error: "Invalid phase value" }, { status: 400 });
  }

  // Create trial
  const { data: trial, error: trialError } = await supabase
    .from("trials")
    .insert({
      org_id: orgId,
      name: name.trim(),
      protocol_number: protocol_number?.trim() || null,
      phase: phase || null,
      status: "active",
      start_date: start_date || null,
      end_date: end_date || null,
      description: description?.trim() || null,
    })
    .select()
    .single();

  if (trialError) {
    console.error("[API] Error creating trial:", trialError);
    return Response.json({ error: "Failed to create trial" }, { status: 500 });
  }

  return Response.json(trial, { status: 201 });
});
