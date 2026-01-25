/**
 * Client - Tasks API Route
 * GET: Get tasks for organization with filtering
 * POST: Create new task
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgMember } from "@/lib/api/middleware";
import { isAdminRole, isCriticalTrialRole } from "@/lib/permissions/constants";
import type { TaskWithContext } from "@/services/tasks/types";

/**
 * GET /api/client/[orgId]/tasks
 * Get tasks for an organization with optional filters
 *
 * Query params:
 * - trial_id: Filter by trial
 * - patient_id: Filter by patient
 * - assigned_to: Filter by assignee (use "me" for current user)
 * - status: Filter by status
 * - priority: Filter by priority
 * - category: Filter by activity type category
 *
 * Access:
 * - superadmin/admin: See ALL tasks in the organization
 * - editor/reader: See tasks based on trial membership:
 *   - PI/CRC in a trial: ALL tasks from that trial
 *   - Other roles: Only tasks assigned to them
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Parse query params
  const url = new URL(req.url);
  const trialIdFilter = url.searchParams.get("trial_id");
  const patientIdFilter = url.searchParams.get("patient_id");
  const assignedToFilter = url.searchParams.get("assigned_to");
  const statusFilter = url.searchParams.get("status");
  const priorityFilter = url.searchParams.get("priority");
  const categoryFilter = url.searchParams.get("category");

  // Determine if user can see all tasks in org
  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  // Base query with joins
  const baseSelect = `
    *,
    patients!left (
      patient_number,
      initials
    ),
    visits!left (
      visit_name,
      scheduled_date
    ),
    activity_types!left (
      id,
      name,
      category
    ),
    trials!inner (
      id,
      name
    ),
    assigned_user:users!tasks_assigned_to_fkey (
      id,
      email,
      full_name
    )
  `;

  if (canViewAll) {
    // Admin/superadmin: Get ALL tasks from org
    let query = supabase
      .from("tasks")
      .select(baseSelect)
      .eq("trials.org_id", orgId)
      .is("deleted_at", null);

    // Apply optional filters
    if (trialIdFilter) query = query.eq("trial_id", trialIdFilter);
    if (patientIdFilter) query = query.eq("patient_id", patientIdFilter);
    if (assignedToFilter) {
      const assignee = assignedToFilter === "me" ? user.id : assignedToFilter;
      query = query.eq("assigned_to", assignee);
    }
    if (statusFilter) query = query.eq("status", statusFilter);
    if (priorityFilter) query = query.eq("priority", priorityFilter);
    // Note: category filter applied post-query due to LEFT JOIN limitations

    const { data: tasks, error } = await query;

    if (error) {
      console.error("[API] Error fetching tasks:", error);
      return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
    }

    // Apply category filter post-query
    let filteredTasks = tasks || [];
    if (categoryFilter) {
      filteredTasks = filteredTasks.filter(
        (task: any) => {
          const category = task.category || task.activity_types?.category;
          return category === categoryFilter;
        }
      );
    }

    return Response.json({
      tasks: transformTasks(filteredTasks),
      total: filteredTasks.length,
    });
  }

  // Non-admin: Get tasks based on trial membership
  // Step 1: Get user's trials with their roles
  const { data: userTrials, error: trialsError } = await supabase
    .from("trial_team_members")
    .select("trial_id, trial_role")
    .eq("org_member_id", user.orgMemberId);

  if (trialsError) {
    console.error("[API] Error fetching user trials:", trialsError);
    return Response.json(
      { error: "Failed to fetch user trials" },
      { status: 500 }
    );
  }

  if (!userTrials || userTrials.length === 0) {
    // No trials assigned
    return Response.json({ tasks: [], total: 0 });
  }

  // Step 2: Build trial-specific queries based on role
  const trialIds = userTrials.map((t) => t.trial_id);
  const criticalTrialIds = userTrials
    .filter((t) => isCriticalTrialRole(t.trial_role as any))
    .map((t) => t.trial_id);

  // Build query
  let query = supabase
    .from("tasks")
    .select(baseSelect)
    .in("trial_id", trialIds)
    .is("deleted_at", null);

  // Apply optional filters
  if (trialIdFilter) query = query.eq("trial_id", trialIdFilter);
  if (patientIdFilter) query = query.eq("patient_id", patientIdFilter);
  if (statusFilter) query = query.eq("status", statusFilter);
  if (priorityFilter) query = query.eq("priority", priorityFilter);
  // Note: category filter applied post-query due to LEFT JOIN limitations

  const { data: tasks, error: tasksError } = await query;

  if (tasksError) {
    console.error("[API] Error fetching tasks:", tasksError);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }

  // Step 3: Filter tasks based on role per trial
  const filteredTasks = (tasks || []).filter((task: any) => {
    // If user is PI/CRC in this trial → see all tasks
    if (criticalTrialIds.includes(task.trial_id)) {
      return true;
    }
    // Otherwise → only see assigned tasks
    return task.assigned_to === user.id;
  });

  // Step 4: Apply assignee filter if provided (after role-based filtering)
  let finalTasks = filteredTasks;
  if (assignedToFilter) {
    const assignee = assignedToFilter === "me" ? user.id : assignedToFilter;
    finalTasks = filteredTasks.filter((task: any) => task.assigned_to === assignee);
  }

  // Step 5: Apply category filter if provided
  if (categoryFilter) {
    finalTasks = finalTasks.filter(
      (task: any) => {
        const category = task.category || task.activity_types?.category;
        return category === categoryFilter;
      }
    );
  }

  return Response.json({
    tasks: transformTasks(finalTasks),
    total: finalTasks.length,
  });
});

/**
 * POST /api/client/[orgId]/tasks
 * Create a new task
 * Any trial member can create tasks
 */
export const POST = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    trial_id,
    patient_id,
    visit_id,
    activity_type_id,
    category,
    title,
    description,
    status,
    priority,
    assigned_to,
    due_date,
  } = body;

  // Validate required fields
  if (!trial_id || !title) {
    return Response.json(
      { error: "trial_id and title are required" },
      { status: 400 }
    );
  }

  // Verify user has access to the trial
  const { data: membership } = await supabase
    .from("trial_team_members")
    .select("id, trial_role")
    .eq("trial_id", trial_id)
    .eq("org_member_id", user.orgMemberId)
    .single();

  const canViewAll = user.isStaff || isAdminRole(user.orgRole);

  if (!canViewAll && !membership) {
    return Response.json(
      { error: "You don't have access to this trial" },
      { status: 403 }
    );
  }

  // Verify trial exists and belongs to org
  const { data: trial, error: trialError } = await supabase
    .from("trials")
    .select("id")
    .eq("id", trial_id)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .single();

  if (trialError || !trial) {
    return Response.json({ error: "Trial not found" }, { status: 404 });
  }

  // Create task
  const { data: task, error: createError } = await supabase
    .from("tasks")
    .insert({
      trial_id,
      patient_id: patient_id || null,
      visit_id: visit_id || null,
      activity_type_id: activity_type_id || null,
      category: category || null,
      title: title.trim(),
      description: description?.trim() || null,
      status: status || "todo",
      priority: priority || null,
      assigned_to: assigned_to || null,
      due_date: due_date || null,
      source: "manual",
    })
    .select()
    .single();

  if (createError) {
    console.error("[API] Error creating task:", createError);
    return Response.json({ error: "Failed to create task" }, { status: 500 });
  }

  return Response.json(task, { status: 201 });
});

/**
 * Transform tasks to TaskWithContext format
 */
function transformTasks(tasks: any[]): TaskWithContext[] {
  return tasks.map((task) => ({
    id: task.id,
    trial_id: task.trial_id,
    patient_id: task.patient_id,
    visit_id: task.visit_id,
    activity_type_id: task.activity_type_id,
    category: task.category,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to,
    due_date: task.due_date,
    source: task.source,
    created_at: task.created_at,
    updated_at: task.updated_at,
    deleted_at: task.deleted_at,
    patient: task.patients
      ? {
          patient_number: task.patients.patient_number,
          initials: task.patients.initials,
        }
      : null,
    visit: task.visits
      ? {
          visit_name: task.visits.visit_name,
          scheduled_date: task.visits.scheduled_date,
        }
      : null,
    activity_type: task.activity_types
      ? {
          id: task.activity_types.id,
          name: task.activity_types.name,
          category: task.activity_types.category,
        }
      : null,
    trial: task.trials
      ? {
          name: task.trials.name,
        }
      : { name: "Unknown" },
    assigned_user: task.assigned_user
      ? {
          id: task.assigned_user.id,
          email: task.assigned_user.email,
          full_name: task.assigned_user.full_name,
        }
      : null,
  }));
}
