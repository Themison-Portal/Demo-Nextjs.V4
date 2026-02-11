import { createClient } from "@/lib/supabase/server";
import type { VisitScheduleTemplate, VisitTemplate } from "./types";
import type { HydrationResult, RecalculationResult } from "./types";
import type {
  EnrollmentPreview,
  EnrollmentVisitPreview,
  EnrollmentActivityPreview,
} from "@/services/patients/types";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get user_id by trial role (replaces DB function get_user_by_trial_role)
 */
async function getUserByTrialRole(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trialId: string,
  role: string
): Promise<string | null> {
  const { data } = await supabase
    .from("trial_team_members")
    .select("organization_members!inner(user_id)")
    .eq("trial_id", trialId)
    .eq("trial_role", role)
    .is("organization_members.deleted_at", null)
    .limit(1)
    .single();

  if (!data) return null;

  const om = data.organization_members as unknown as { user_id: string };
  return om.user_id;
}

/**
 * Resolve activity name from trial_activity_types → activity_types → fallback
 */
async function resolveActivityName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trialId: string,
  activityId: string
): Promise<string> {
  // Try trial-specific first
  const { data: trialActivity } = await supabase
    .from("trial_activity_types")
    .select("name")
    .eq("trial_id", trialId)
    .eq("activity_id", activityId)
    .is("deleted_at", null)
    .limit(1)
    .single();

  if (trialActivity?.name) return trialActivity.name;

  // Fallback to global catalog
  const { data: globalActivity } = await supabase
    .from("activity_types")
    .select("name")
    .eq("id", activityId)
    .is("deleted_at", null)
    .limit(1)
    .single();

  if (globalActivity?.name) return globalActivity.name;

  // Ultimate fallback
  return activityId;
}

/**
 * Get trial template or throw
 */
async function getTrialTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trialId: string
): Promise<VisitScheduleTemplate> {
  const { data: trial } = await supabase
    .from("trials")
    .select("visit_schedule_template")
    .eq("id", trialId)
    .is("deleted_at", null)
    .single();

  if (!trial?.visit_schedule_template) {
    throw new Error(`Trial ${trialId} has no visit schedule template`);
  }

  return trial.visit_schedule_template as VisitScheduleTemplate;
}

/**
 * Resolve assignee user_id for an activity, considering overrides
 */
async function resolveAssignee(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trialId: string,
  activityId: string,
  visitOrder: number,
  assignees: Record<string, string>,
  overrides?: Record<string, string | null> | null
): Promise<string | null> {
  // Check overrides first
  if (overrides) {
    // Visit-specific key: "v{order}-{activityId}"
    const visitKey = `v${visitOrder}-${activityId}`;
    const overrideValue = overrides[visitKey] ?? overrides[activityId];

    if (overrideValue !== undefined) {
      if (!overrideValue || overrideValue === "null") return null;
      return overrideValue;
    }
  }

  // Template assignee
  const role = assignees[activityId];
  if (!role) return null;

  return getUserByTrialRole(supabase, trialId, role);
}

// ============================================================================
// Core hydration logic for a single visit
// ============================================================================

async function hydrateVisitFromTemplate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  trialId: string,
  patientId: string,
  visit: VisitTemplate,
  scheduledDate: string,
  template: VisitScheduleTemplate,
  overrides?: Record<string, string | null> | null
): Promise<{ activitiesCreated: number; tasksCreated: number }> {
  // Create visit record
  const { data: visitRecord, error: visitError } = await supabase
    .from("visits")
    .insert({
      patient_id: patientId,
      visit_template_name: visit.name,
      visit_name: visit.name,
      visit_order: visit.order,
      days_from_day_zero: visit.days_from_day_zero,
      is_day_zero: visit.is_day_zero ?? false,
      scheduled_date: scheduledDate,
      status: "scheduled",
    })
    .select("id")
    .single();

  if (visitError || !visitRecord) {
    throw new Error(`Failed to create visit: ${visitError?.message}`);
  }

  let activitiesCreated = 0;
  let tasksCreated = 0;

  // Loop through activities
  for (let i = 0; i < (visit.activity_ids?.length ?? 0); i++) {
    const activityId = visit.activity_ids[i];
    const activityOrder = i + 1;

    const activityName = await resolveActivityName(
      supabase,
      trialId,
      activityId
    );

    // Create visit_activity
    const { data: activityRecord, error: activityError } = await supabase
      .from("visit_activities")
      .insert({
        visit_id: visitRecord.id,
        activity_type_id: activityId,
        activity_name: activityName,
        activity_order: activityOrder,
        status: "pending",
      })
      .select("id")
      .single();

    if (activityError || !activityRecord) {
      throw new Error(
        `Failed to create visit_activity: ${activityError?.message}`
      );
    }

    activitiesCreated++;

    // Resolve assignee
    const assigneeUserId = await resolveAssignee(
      supabase,
      trialId,
      activityId,
      visit.order,
      template.assignees,
      overrides
    );

    // Create task
    const { error: taskError } = await supabase.from("tasks").insert({
      trial_id: trialId,
      patient_id: patientId,
      visit_id: visitRecord.id,
      visit_activity_id: activityRecord.id,
      activity_type_id: activityId,
      title: `${activityName} - ${visit.name}`,
      status: "todo",
      priority: null,
      assigned_to: assigneeUserId,
      due_date: scheduledDate,
      source: "visit",
      source_id: visitRecord.id,
    });

    if (taskError) {
      throw new Error(`Failed to create task: ${taskError.message}`);
    }

    tasksCreated++;
  }

  return { activitiesCreated, tasksCreated };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Hydrate screening visit only
 *
 * Creates ONLY the screening visit (order=1) and its tasks.
 * Called when a patient is created with a screening_date.
 * Also calculates and updates patient.baseline_deadline_date.
 */
export async function hydrateScreeningVisit(
  patientId: string,
  trialId: string,
  screeningDate: string
): Promise<HydrationResult & { baseline_deadline_date: string }> {
  const supabase = await createClient();
  const template = await getTrialTemplate(supabase, trialId);

  // Find screening visit (order=1, not day_zero)
  const screeningVisit = template.visits.find(
    (v) => v.order === 1 && !v.is_day_zero
  );

  if (!screeningVisit) {
    throw new Error(
      "Template must have a screening visit (order=1, is_day_zero=false)"
    );
  }

  // Find day_zero visit to calculate baseline_deadline
  const dayZeroVisit = template.visits.find((v) => v.is_day_zero);

  if (!dayZeroVisit) {
    throw new Error("Template must have a day_zero visit");
  }

  // Calculate baseline_deadline_date
  const windowDays = Math.abs(
    dayZeroVisit.days_from_day_zero - screeningVisit.days_from_day_zero
  );

  const screeningDateObj = new Date(screeningDate);
  const baselineDeadline = new Date(screeningDateObj);
  baselineDeadline.setDate(baselineDeadline.getDate() + windowDays);
  const baselineDeadlineStr = baselineDeadline.toISOString().split("T")[0];

  // Update patient with baseline_deadline_date
  const { error: patientError } = await supabase
    .from("patients")
    .update({ baseline_deadline_date: baselineDeadlineStr })
    .eq("id", patientId);

  if (patientError) {
    throw new Error(
      `Failed to update patient baseline_deadline: ${patientError.message}`
    );
  }

  // Hydrate the screening visit
  const { activitiesCreated, tasksCreated } = await hydrateVisitFromTemplate(
    supabase,
    trialId,
    patientId,
    screeningVisit,
    screeningDate,
    template
  );

  return {
    visits_created: 1,
    activities_created: activitiesCreated,
    tasks_created: tasksCreated,
    patient_id: patientId,
    trial_id: trialId,
    baseline_deadline_date: baselineDeadlineStr,
  };
}

/**
 * Hydrate remaining visits (Day 0 onwards)
 *
 * Creates remaining visits (order > 1, from Day 0 onwards) and their tasks.
 * Called during enrollment when baseline_date is set.
 */
export async function hydrateRemainingVisits(
  patientId: string,
  trialId: string,
  baselineDate: string,
  assigneeOverrides?: Record<string, string | null>
): Promise<HydrationResult> {
  const supabase = await createClient();
  const template = await getTrialTemplate(supabase, trialId);

  // Filter visits with order > 1, sorted by order
  const remainingVisits = template.visits
    .filter((v) => v.order > 1)
    .sort((a, b) => a.order - b.order);

  let visitsCreated = 0;
  let activitiesCreated = 0;
  let tasksCreated = 0;

  const baselineDateObj = new Date(baselineDate);

  for (const visit of remainingVisits) {
    // Calculate scheduled date from baseline
    const scheduledDateObj = new Date(baselineDateObj);
    scheduledDateObj.setDate(
      scheduledDateObj.getDate() + visit.days_from_day_zero
    );
    const scheduledDate = scheduledDateObj.toISOString().split("T")[0];

    const result = await hydrateVisitFromTemplate(
      supabase,
      trialId,
      patientId,
      visit,
      scheduledDate,
      template,
      assigneeOverrides
    );

    visitsCreated++;
    activitiesCreated += result.activitiesCreated;
    tasksCreated += result.tasksCreated;
  }

  return {
    visits_created: visitsCreated,
    activities_created: activitiesCreated,
    tasks_created: tasksCreated,
    patient_id: patientId,
    trial_id: trialId,
  };
}

/**
 * Preview enrollment (read-only)
 *
 * Calculates what visits/activities would be created during enrollment
 * WITHOUT inserting any records. Used for the enrollment preview UI.
 */
export async function previewEnrollment(
  patientId: string,
  trialId: string,
  baselineDate: string
): Promise<EnrollmentPreview> {
  const supabase = await createClient();
  const template = await getTrialTemplate(supabase, trialId);

  const remainingVisits = template.visits
    .filter((v) => v.order > 1)
    .sort((a, b) => a.order - b.order);

  const baselineDateObj = new Date(baselineDate);
  const visitsPreview: EnrollmentVisitPreview[] = [];
  let totalActivities = 0;

  for (const visit of remainingVisits) {
    const scheduledDateObj = new Date(baselineDateObj);
    scheduledDateObj.setDate(
      scheduledDateObj.getDate() + visit.days_from_day_zero
    );
    const scheduledDate = scheduledDateObj.toISOString().split("T")[0];

    const activitiesPreview: EnrollmentActivityPreview[] = [];

    for (const activityId of visit.activity_ids ?? []) {
      const activityName = await resolveActivityName(
        supabase,
        trialId,
        activityId
      );

      const role = template.assignees[activityId] ?? null;
      let assigneeUserId: string | null = null;
      let assigneeUser: { id: string; name: string; email: string } | null =
        null;

      if (role) {
        // Get user info for preview (not just user_id)
        const { data } = await supabase
          .from("trial_team_members")
          .select(
            "organization_members!inner(user_id, users!inner(id, full_name, email))"
          )
          .eq("trial_id", trialId)
          .eq("trial_role", role)
          .is("organization_members.deleted_at", null)
          .limit(1)
          .single();

        if (data) {
          const om = data.organization_members as unknown as {
            user_id: string;
            users: { id: string; full_name: string; email: string };
          };
          assigneeUserId = om.user_id;
          assigneeUser = {
            id: om.users.id,
            name: om.users.full_name,
            email: om.users.email,
          };
        }
      }

      activitiesPreview.push({
        activity_id: activityId,
        activity_name: activityName,
        assigned_to_role: role,
        assigned_to_user_id: assigneeUserId,
        assigned_to_user: assigneeUser,
      });

      totalActivities++;
    }

    visitsPreview.push({
      name: visit.name,
      order: visit.order,
      scheduled_date: scheduledDate,
      days_from_day_zero: visit.days_from_day_zero,
      is_day_zero: visit.is_day_zero ?? false,
      activities: activitiesPreview,
    });
  }

  return {
    visits: visitsPreview,
    total_visits: visitsPreview.length,
    total_activities: totalActivities,
    baseline_date: baselineDate,
  };
}

/**
 * Recalculate visit schedule for a patient
 *
 * Updates all visit scheduled_date and task due_date based on a new start date.
 * Used when a patient is randomized and the reference date changes.
 */
export async function recalculateVisitSchedule(
  patientId: string,
  newVisitStartDate: string
): Promise<RecalculationResult> {
  const supabase = await createClient();

  // Get all visits for this patient
  const { data: visits, error: visitsError } = await supabase
    .from("visits")
    .select("id, days_from_day_zero")
    .eq("patient_id", patientId);

  if (visitsError) {
    throw new Error(
      `Failed to fetch visits: ${visitsError.message}`
    );
  }

  const startDate = new Date(newVisitStartDate);
  let visitsUpdated = 0;
  let tasksUpdated = 0;

  for (const visit of visits ?? []) {
    const newScheduledDate = new Date(startDate);
    newScheduledDate.setDate(
      newScheduledDate.getDate() + (visit.days_from_day_zero ?? 0)
    );
    const scheduledDateStr = newScheduledDate.toISOString().split("T")[0];

    // Update visit
    const { error: updateVisitError } = await supabase
      .from("visits")
      .update({ scheduled_date: scheduledDateStr })
      .eq("id", visit.id);

    if (updateVisitError) {
      throw new Error(
        `Failed to update visit: ${updateVisitError.message}`
      );
    }
    visitsUpdated++;

    // Update tasks linked to this visit
    const { count } = await supabase
      .from("tasks")
      .update({ due_date: scheduledDateStr })
      .eq("visit_id", visit.id)
      .eq("patient_id", patientId)
      .is("deleted_at", null)
      .select("*", { count: "exact", head: true });

    tasksUpdated += count ?? 0;
  }

  return {
    visits_updated: visitsUpdated,
    tasks_updated: tasksUpdated,
    patient_id: patientId,
    new_visit_start_date: newVisitStartDate,
  };
}
