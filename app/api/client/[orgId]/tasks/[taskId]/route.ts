/**
 * Client - Task Detail API Route
 * PATCH: Update task
 * DELETE: Soft delete task
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgMember } from "@/lib/api/middleware";
import { isAdminRole, isCriticalTrialRole } from "@/lib/permissions/constants";

/**
 * PATCH /api/client/[orgId]/tasks/[taskId]
 * Update a task
 *
 * Permissions:
 * - Admin/superadmin: can update any task
 * - PI/CRC: can update any task in their trials
 * - Other roles: can update only their assigned tasks
 */
export const PATCH = withOrgMember(async (req, ctx, user) => {
  const { taskId } = ctx.params;
  const supabase = await createClient();

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Get existing task
  const { data: existingTask, error: fetchError } = await supabase
    .from("tasks")
    .select("id, trial_id, assigned_to, visit_activity_id")
    .eq("id", taskId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existingTask) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  // Check permissions
  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  if (!canViewAll) {
    // Check if user is member of the trial
    const { data: membership } = await supabase
      .from("trial_team_members")
      .select("trial_role")
      .eq("trial_id", existingTask.trial_id)
      .eq("org_member_id", user.orgMemberId)
      .single();

    if (!membership) {
      return Response.json(
        { error: "You don't have access to this trial" },
        { status: 403 }
      );
    }

    // If not PI/CRC, can only update own tasks
    const isCritical = isCriticalTrialRole(membership.trial_role as any);
    if (!isCritical && existingTask.assigned_to !== user.id) {
      return Response.json(
        { error: "You can only update tasks assigned to you" },
        { status: 403 }
      );
    }
  }

  // Build update object (only include provided fields)
  const updateData: any = {};
  if (body.title !== undefined) updateData.title = body.title.trim();
  if (body.description !== undefined)
    updateData.description = body.description?.trim() || null;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to;
  if (body.due_date !== undefined) updateData.due_date = body.due_date;
  if (body.patient_id !== undefined) updateData.patient_id = body.patient_id;
  if (body.visit_id !== undefined) updateData.visit_id = body.visit_id;
  if (body.activity_type_id !== undefined)
    updateData.activity_type_id = body.activity_type_id;

  // Update task
  const { data: task, error: updateError } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .select()
    .single();

  if (updateError) {
    console.error("[API] Error updating task:", updateError);
    return Response.json({ error: "Failed to update task" }, { status: 500 });
  }

  // Auto-complete activity if task is completed (Hybrid logic: Option 3)
  if (body.status === 'completed' && existingTask.visit_activity_id) {
    const { error: activityError } = await supabase
      .from("visit_activities")
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: user.id
      })
      .eq("id", existingTask.visit_activity_id);

    if (activityError) {
      console.error("[API] Error auto-completing activity:", activityError);
      // Don't fail the request - task was updated successfully
    }
  }

  return Response.json(task);
});

/**
 * DELETE /api/client/[orgId]/tasks/[taskId]
 * Soft delete a task
 *
 * Permissions:
 * - Admin/superadmin: can delete any task
 * - PI/CRC: can delete any task in their trials
 * - Other roles: can delete only their assigned tasks
 */
export const DELETE = withOrgMember(async (req, ctx, user) => {
  const { taskId } = ctx.params;
  const supabase = await createClient();

  // Get existing task
  const { data: existingTask, error: fetchError } = await supabase
    .from("tasks")
    .select("id, trial_id, assigned_to")
    .eq("id", taskId)
    .is("deleted_at", null)
    .single();

  if (fetchError || !existingTask) {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  // Check permissions
  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  if (!canViewAll) {
    // Check if user is member of the trial
    const { data: membership } = await supabase
      .from("trial_team_members")
      .select("trial_role")
      .eq("trial_id", existingTask.trial_id)
      .eq("org_member_id", user.orgMemberId)
      .single();

    if (!membership) {
      return Response.json(
        { error: "You don't have access to this trial" },
        { status: 403 }
      );
    }

    // If not PI/CRC, can only delete own tasks
    const isCritical = isCriticalTrialRole(membership.trial_role as any);
    if (!isCritical && existingTask.assigned_to !== user.id) {
      return Response.json(
        { error: "You can only delete tasks assigned to you" },
        { status: 403 }
      );
    }
  }

  // Soft delete
  const { error: deleteError } = await supabase
    .from("tasks")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", taskId);

  if (deleteError) {
    console.error("[API] Error deleting task:", deleteError);
    return Response.json({ error: "Failed to delete task" }, { status: 500 });
  }

  return Response.json({ success: true });
});
