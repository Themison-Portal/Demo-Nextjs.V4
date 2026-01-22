import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import { hydrateRemainingVisits } from "@/services/visits/hydration";
import type { EnrollPatientInput } from "@/services/patients/types";

// PATCH: Enroll patient (set baseline_date and hydrate remaining visits)
export const PATCH = withTrialMember(async (req, ctx, user) => {
  const { trialId, patientId } = ctx.params;
  const supabase = await createClient();

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canManagePatients) {
    return responses.forbidden("You don't have permission to enroll patients");
  }

  let body: EnrollPatientInput;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { baseline_date, assignee_overrides } = body;

  // Validate baseline_date is provided
  if (!baseline_date) {
    return Response.json({ error: "baseline_date is required" }, { status: 400 });
  }

  // Get patient
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("*")
    .eq("id", patientId)
    .eq("trial_id", trialId)
    .is("deleted_at", null)
    .single();

  if (patientError || !patient) {
    return Response.json({ error: "Patient not found" }, { status: 404 });
  }

  // Validate patient status
  if (patient.status !== "screening") {
    return Response.json(
      {
        error: `Cannot enroll patient with status "${patient.status}". Patient must be in "screening" status.`,
      },
      { status: 400 }
    );
  }

  // Validate screening_date exists
  if (!patient.screening_date) {
    return Response.json(
      { error: "Cannot enroll patient without screening_date" },
      { status: 400 }
    );
  }

  // Validate baseline_date is within window
  const screeningDate = new Date(patient.screening_date);
  const baselineDateObj = new Date(baseline_date);
  const baselineDeadline = patient.baseline_deadline_date
    ? new Date(patient.baseline_deadline_date)
    : null;

  // baseline_date must be after screening_date
  if (baselineDateObj <= screeningDate) {
    return Response.json(
      {
        error: `baseline_date (${baseline_date}) must be after screening_date (${patient.screening_date})`,
      },
      { status: 400 }
    );
  }

  // baseline_date must be before baseline_deadline_date
  if (baselineDeadline && baselineDateObj > baselineDeadline) {
    return Response.json(
      {
        error: `baseline_date (${baseline_date}) must be before or on baseline_deadline_date (${patient.baseline_deadline_date})`,
      },
      { status: 400 }
    );
  }

  // baseline_date cannot be in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (baselineDateObj < today) {
    return Response.json(
      { error: "baseline_date cannot be in the past" },
      { status: 400 }
    );
  }

  // Update patient: set baseline_date, enrollment_date, status
  const { data: updatedPatient, error: updateError } = await supabase
    .from("patients")
    .update({
      baseline_date,
      enrollment_date: new Date().toISOString().split("T")[0], // Today's date
      status: "enrolled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId)
    .eq("trial_id", trialId)
    .is("deleted_at", null)
    .select()
    .single();

  if (updateError) {
    console.error("[API] Error updating patient:", updateError);
    return Response.json({ error: "Failed to enroll patient" }, { status: 500 });
  }

  // Hydrate remaining visits (Day 0 onwards)
  let hydrationResult = null;
  try {
    hydrationResult = await hydrateRemainingVisits(
      patientId,
      trialId,
      baseline_date,
      assignee_overrides
    );
    console.log("[API] Remaining visits hydrated:", hydrationResult);
  } catch (hydrationError: unknown) {
    const errorMessage =
      hydrationError instanceof Error ? hydrationError.message : "Unknown error";
    console.error("[API] Error hydrating remaining visits:", errorMessage);

    // Rollback patient enrollment on hydration failure
    await supabase
      .from("patients")
      .update({
        baseline_date: null,
        enrollment_date: null,
        status: "screening",
        updated_at: new Date().toISOString(),
      })
      .eq("id", patientId);

    return Response.json(
      { error: "Failed to hydrate remaining visits: " + errorMessage },
      { status: 500 }
    );
  }

  return Response.json({
    ...updatedPatient,
    ...(hydrationResult && { hydration: hydrationResult }),
  });
});
