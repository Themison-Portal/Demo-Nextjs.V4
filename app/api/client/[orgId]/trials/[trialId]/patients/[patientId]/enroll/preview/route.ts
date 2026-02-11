import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import { previewEnrollment } from "@/services/visits/hydration";

// GET: Preview enrollment (what visits/activities would be created)
export const GET = withTrialMember(async (req, ctx, user) => {
  const { trialId, patientId } = ctx.params;
  const supabase = await createClient();

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canViewPatients) {
    return responses.forbidden("You don't have permission to view patients");
  }

  // Get baseline_date from query params
  const { searchParams } = new URL(req.url);
  const baselineDate = searchParams.get("baseline_date");

  if (!baselineDate) {
    return Response.json(
      { error: "baseline_date query parameter is required" },
      { status: 400 }
    );
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
        error: `Cannot preview enrollment for patient with status "${patient.status}"`,
      },
      { status: 400 }
    );
  }

  // Validate screening_date exists
  if (!patient.screening_date) {
    return Response.json(
      { error: "Cannot preview enrollment: patient has no screening_date" },
      { status: 400 }
    );
  }

  // Validate baseline_date is within window
  const screeningDate = new Date(patient.screening_date);
  const baselineDateObj = new Date(baselineDate);
  const baselineDeadline = patient.baseline_deadline_date
    ? new Date(patient.baseline_deadline_date)
    : null;

  if (baselineDateObj <= screeningDate) {
    return Response.json(
      {
        error: `baseline_date must be after screening_date (${patient.screening_date})`,
      },
      { status: 400 }
    );
  }

  if (baselineDeadline && baselineDateObj > baselineDeadline) {
    return Response.json(
      {
        error: `baseline_date must be before baseline_deadline_date (${patient.baseline_deadline_date})`,
      },
      { status: 400 }
    );
  }

  // Generate preview using TS function (no DB inserts)
  try {
    const preview = await previewEnrollment(patientId, trialId, baselineDate);
    return Response.json(preview);
  } catch (err) {
    console.error("[API] Error generating enrollment preview:", err);
    return Response.json(
      { error: "Failed to generate enrollment preview" },
      { status: 500 }
    );
  }
});
