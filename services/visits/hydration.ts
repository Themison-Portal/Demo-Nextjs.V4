import { createClient } from "@/lib/supabase/server";
import type { HydrationResult, RecalculationResult } from "./types";

/**
 * Hydrate screening visit only
 *
 * Creates ONLY the screening visit (order=1) and its tasks.
 * Called when a patient is created with a screening_date.
 * Also calculates and updates patient.baseline_deadline_date.
 *
 * @param patientId - Patient UUID
 * @param trialId - Trial UUID
 * @param screeningDate - Date of screening visit
 * @returns Summary of created records + baseline_deadline_date
 * @throws Error if trial has no template or hydration fails
 */
export async function hydrateScreeningVisit(
  patientId: string,
  trialId: string,
  screeningDate: string
): Promise<HydrationResult & { baseline_deadline_date: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("hydrate_screening_visit", {
    p_patient_id: patientId,
    p_trial_id: trialId,
    p_screening_date: screeningDate,
  });

  if (error) {
    console.error("[hydration] Error hydrating screening visit:", error);
    throw new Error(error.message || "Failed to hydrate screening visit");
  }

  if (!data) {
    throw new Error("Screening hydration returned no data");
  }

  return data as HydrationResult & { baseline_deadline_date: string };
}

/**
 * Hydrate remaining visits (Day 0 onwards)
 *
 * Creates remaining visits (order > 1, from Day 0 onwards) and their tasks.
 * Called during enrollment when baseline_date is set.
 *
 * @param patientId - Patient UUID
 * @param trialId - Trial UUID
 * @param baselineDate - Date of Day 0 (Baseline visit)
 * @returns Summary of created records
 * @throws Error if trial has no template or hydration fails
 */
export async function hydrateRemainingVisits(
  patientId: string,
  trialId: string,
  baselineDate: string,
  assigneeOverrides?: Record<string, string | null>
): Promise<HydrationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("hydrate_remaining_visits", {
    p_patient_id: patientId,
    p_trial_id: trialId,
    p_baseline_date: baselineDate,
    p_assignee_overrides: assigneeOverrides || null,
  });

  if (error) {
    console.error("[hydration] Error hydrating remaining visits:", error);
    throw new Error(error.message || "Failed to hydrate remaining visits");
  }

  if (!data) {
    throw new Error("Remaining visits hydration returned no data");
  }

  return data as HydrationResult;
}

/**
 * @deprecated Use hydrateScreeningVisit + hydrateRemainingVisits instead
 * Hydrate visit schedule for a patient
 *
 * Generates visits, visit_activities, and tasks from the trial's JSONB template.
 * Called when a patient is created with a visit_start_date.
 *
 * @param patientId - Patient UUID
 * @param trialId - Trial UUID
 * @param visitStartDate - Date of day zero visit (can calculate negative offsets)
 * @returns Summary of created records
 * @throws Error if trial has no template or hydration fails
 */
export async function hydrateVisitSchedule(
  patientId: string,
  trialId: string,
  visitStartDate: string
): Promise<HydrationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("hydrate_visit_schedule", {
    p_patient_id: patientId,
    p_trial_id: trialId,
    p_visit_start_date: visitStartDate,
  });

  if (error) {
    console.error("[hydration] Error hydrating visit schedule:", error);
    throw new Error(error.message || "Failed to hydrate visit schedule");
  }

  if (!data) {
    throw new Error("Hydration returned no data");
  }

  return data as HydrationResult;
}

/**
 * Recalculate visit schedule for a patient
 *
 * Updates all visit scheduled_date and task due_date based on a new visit_start_date.
 * Used when a patient is randomized and the reference date changes.
 *
 * @param patientId - Patient UUID
 * @param newVisitStartDate - New date for day zero
 * @returns Summary of updated records
 * @throws Error if recalculation fails
 */
export async function recalculateVisitSchedule(
  patientId: string,
  newVisitStartDate: string
): Promise<RecalculationResult> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("recalculate_visit_schedule", {
    p_patient_id: patientId,
    p_new_visit_start_date: newVisitStartDate,
  });

  if (error) {
    console.error("[hydration] Error recalculating visit schedule:", error);
    throw new Error(
      error.message || "Failed to recalculate visit schedule"
    );
  }

  if (!data) {
    throw new Error("Recalculation returned no data");
  }

  return data as RecalculationResult;
}
