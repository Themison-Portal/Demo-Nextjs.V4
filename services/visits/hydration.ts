import { createClient } from "@/lib/supabase/server";
import type { HydrationResult, RecalculationResult } from "./types";

/**
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
    throw new Error(
      error.message || "Failed to hydrate visit schedule"
    );
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
