/**
 * Client - Trials API Route
 * GET: List trials for organization
 * POST: Create new trial
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgPermission } from "@/lib/api/middleware";

/**
 * GET /api/client/[orgId]/trials
 * Get all trials for an organization
 * Allows: superadmin, admin of org, or staff with support_enabled
 */
export const GET = withOrgPermission(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Fetch trials with team member count
  const { data: trials, error: trialsError } = await supabase
    .from("trials")
    .select(`
      *,
      trial_team_members (
        id,
        trial_role,
        org_member_id,
        organization_members:org_member_id (
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

  if (trialsError) {
    console.error("[API] Error fetching trials:", trialsError);
    return Response.json({ error: "Failed to fetch trials" }, { status: 500 });
  }

  // Transform to include computed fields
  const transformedTrials = (trials || []).map((trial) => {
    const teamMembers = trial.trial_team_members || [];

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
  const validPhases = ["Phase I", "Phase II", "Phase III", "Phase IV"];
  if (phase && !validPhases.includes(phase)) {
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
