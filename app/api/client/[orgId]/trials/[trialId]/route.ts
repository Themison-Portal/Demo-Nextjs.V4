/**
 * Client - Trial Detail API Route
 * GET: Get single trial with full details
 * PATCH: Update trial fields
 */

import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";

/**
 * GET /api/client/[orgId]/trials/[trialId]
 * Get trial details with team members, visit schedules, and stats
 * Allows: org admin OR trial team member
 */
export const GET = withTrialMember(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  // Fetch trial
  const { data: trial, error: trialError } = await supabase
    .from("trials")
    .select("*")
    .eq("id", trialId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .single();

  if (trialError || !trial) {
    console.error("[API] Error fetching trial:", trialError);
    return Response.json({ error: "Trial not found" }, { status: 404 });
  }

  // Fetch team members with user data
  const { data: allMembers, error: teamError } = await supabase
    .from("trial_team_members")
    .select(`
      id,
      trial_id,
      org_member_id,
      trial_role,
      assigned_at,
      assigned_by,
      organization_members:org_member_id (
        deleted_at,
        user:user_id (
          id,
          email,
          full_name,
          avatar_url
        )
      )
    `)
    .eq("trial_id", trialId);

  // Filter out members whose org membership was deleted (user removed from org)
  const teamMembers = (allMembers || []).filter(
    (member: any) => member.organization_members?.deleted_at === null
  );

  if (teamError) {
    console.error("[API] Error fetching team members:", teamError);
    return Response.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }

  // Transform team members to flatten user data
  const transformedTeamMembers = (teamMembers || []).map((member: any) => {
    const user = member.organization_members?.user;
    return {
      id: member.id,
      trial_id: member.trial_id,
      org_member_id: member.org_member_id,
      trial_role: member.trial_role,
      assigned_at: member.assigned_at,
      assigned_by: member.assigned_by,
      user: user || null,
    };
  });

  // Fetch visit schedule templates
  const { data: visitSchedules, error: visitError } = await supabase
    .from("visit_schedule_templates")
    .select("*")
    .eq("trial_id", trialId)
    .is("deleted_at", null)
    .order("visit_order", { ascending: true });

  if (visitError) {
    console.error("[API] Error fetching visit schedules:", visitError);
    return Response.json(
      { error: "Failed to fetch visit schedules" },
      { status: 500 }
    );
  }

  // Get patient counts
  const { count: patientCount, error: patientCountError } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("trial_id", trialId)
    .is("deleted_at", null);

  const { count: activePatientCount } = await supabase
    .from("patients")
    .select("*", { count: "exact", head: true })
    .eq("trial_id", trialId)
    .in("status", ["screening", "enrolled"])
    .is("deleted_at", null);

  // Get task counts
  const { count: taskCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("trial_id", trialId)
    .is("deleted_at", null);

  const { count: pendingTaskCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("trial_id", trialId)
    .in("status", ["todo", "in_progress"])
    .is("deleted_at", null);

  return Response.json({
    ...trial,
    team_members: transformedTeamMembers,
    visit_schedules: visitSchedules || [],
    patient_count: patientCount || 0,
    active_patient_count: activePatientCount || 0,
    task_count: taskCount || 0,
    pending_task_count: pendingTaskCount || 0,
  });
});

/**
 * PATCH /api/client/[orgId]/trials/[trialId]
 * Update trial fields
 * Allows: org admin OR trial member with edit permission (PI, CRC, editor)
 */
export const PATCH = withTrialMember(async (req, ctx, user) => {
  // Debug logging
  console.log("[PATCH Trial] User context:", {
    orgRole: user.orgRole,
    trialRole: user.trialRole,
    orgMemberId: user.orgMemberId,
  });

  // Check edit permission
  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  console.log("[PATCH Trial] Permissions:", { canEditTrial: perms.canEditTrial });

  if (!perms.canEditTrial) {
    console.log("[PATCH Trial] DENIED - canEditTrial is false");
    return responses.forbidden("You don't have permission to edit this trial");
  }

  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate trial exists and belongs to org
  const { data: existingTrial, error: findError } = await supabase
    .from("trials")
    .select("id, settings")
    .eq("id", trialId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .single();

  if (findError || !existingTrial) {
    return Response.json({ error: "Trial not found" }, { status: 404 });
  }

  // Build update object with only allowed fields
  const allowedFields = [
    "name",
    "protocol_number",
    "phase",
    "status",
    "start_date",
    "end_date",
    "description",
  ];

  const updateData: Record<string, any> = {};

  for (const field of allowedFields) {
    if (field in body) {
      // Handle empty strings as null for optional fields
      if (field !== "name" && body[field] === "") {
        updateData[field] = null;
      } else {
        updateData[field] = body[field];
      }
    }
  }

  // Handle settings merge (partial update)
  if (body.settings && typeof body.settings === "object") {
    const currentSettings = (existingTrial.settings as Record<string, unknown>) || {};
    updateData.settings = {
      ...currentSettings,
      ...body.settings,
    };
  }

  // Validate name if provided
  if ("name" in updateData && (!updateData.name || updateData.name.trim() === "")) {
    return Response.json({ error: "Trial name cannot be empty" }, { status: 400 });
  }

  // Validate phase if provided
  const validPhases = ["Phase I", "Phase II", "Phase III", "Phase IV"];
  if (updateData.phase && !validPhases.includes(updateData.phase)) {
    return Response.json({ error: "Invalid phase value" }, { status: 400 });
  }

  // Validate status if provided
  const validStatuses = ["active", "paused", "completed", "terminated"];
  if (updateData.status && !validStatuses.includes(updateData.status)) {
    return Response.json({ error: "Invalid status value" }, { status: 400 });
  }

  // Update trial
  const { data: updatedTrial, error: updateError } = await supabase
    .from("trials")
    .update(updateData)
    .eq("id", trialId)
    .select()
    .single();

  if (updateError) {
    console.error("[API] Error updating trial:", updateError);
    return Response.json({ error: "Failed to update trial" }, { status: 500 });
  }

  return Response.json(updatedTrial);
});
