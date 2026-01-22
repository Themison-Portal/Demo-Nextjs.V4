/**
 * Client - My Tasks API Route
 * GET: Get tasks assigned to current user across all trials
 */

import { createClient } from "@/lib/supabase/server";
import { withAuth } from "@/lib/api/middleware";
import type { TaskWithContext } from "@/services/tasks/types";

/**
 * GET /api/client/me/tasks
 * Get tasks assigned to current user with patient, visit, and trial context
 */
export const GET = withAuth(async (req, ctx, user) => {
  const supabase = await createClient();

  // Fetch tasks assigned to current user with related data
  // Using LEFT JOINs to handle tasks without patient/visit/activity_type
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select(
      `
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
        name
      )
    `
    )
    .eq("assigned_to", user.id)
    .is("deleted_at", null)
    .order("priority", { ascending: false }) // Will be sorted manually for custom order
    .order("due_date", { ascending: true });

  if (error) {
    console.error("[API] Error fetching my tasks:", error);
    return Response.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }

  // Custom sort by priority (urgent > high > medium > low)
  // Then by due_date (nulls last)
  const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
  const sortedTasks = (tasks || []).sort((a, b) => {
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, sort by due_date (nulls last)
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  // Transform to TaskWithContext format
  const transformedTasks: TaskWithContext[] = sortedTasks.map((task: any) => ({
    id: task.id,
    trial_id: task.trial_id,
    patient_id: task.patient_id,
    visit_id: task.visit_id,
    activity_type_id: task.activity_type_id,
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
    trial: {
      name: task.trials.name,
    },
  }));

  return Response.json({
    tasks: transformedTasks,
    total: transformedTasks.length,
  });
});
