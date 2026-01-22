import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import { hydrateScreeningVisit } from "@/services/visits/hydration";
import { PATIENT_CONSTANTS } from "@/lib/constants";

// GET: Listar patients
export const GET = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  const supabase = await createClient();

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canViewPatients) {
    return responses.forbidden("No tienes permiso para ver pacientes");
  }

  const { data: patients, error } = await supabase
    .from("patients")
    .select("*")
    .eq("trial_id", trialId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API] Error fetching patients:", error);
    return Response.json({ error: "Failed to fetch patients" }, { status: 500 });
  }

  return Response.json({ patients: patients || [], total: (patients || []).length });
});

// POST: Crear patient
export const POST = withTrialMember(async (req, ctx, user) => {
  const { orgId, trialId } = ctx.params;
  const supabase = await createClient();

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canManagePatients) {
    return responses.forbidden("No tienes permiso para crear pacientes");
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { patient_number, initials, date_of_birth, sex, screening_date, notes } = body;

  // Validate patient_number required
  if (!patient_number || patient_number.trim() === "") {
    return Response.json({ error: "Patient number is required" }, { status: 400 });
  }

  // Validate sex if exists
  if (sex && !PATIENT_CONSTANTS.sex.includes(sex)) {
    return Response.json({ error: "Invalid sex value" }, { status: 400 });
  }

  // Verify trial exists
  const { data: trial, error: trialError } = await supabase
    .from("trials")
    .select("id, visit_schedule_template")
    .eq("id", trialId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .single();

  if (trialError || !trial) {
    return Response.json({ error: "Trial not found" }, { status: 404 });
  }

  // If screening_date provided, validate template exists
  if (screening_date && !trial.visit_schedule_template) {
    return Response.json(
      { error: "Cannot create patient with screening_date: trial has no visit schedule template" },
      { status: 400 }
    );
  }

  // Verify patient_number is unique in this trial
  const { data: existing } = await supabase
    .from("patients")
    .select("id")
    .eq("trial_id", trialId)
    .eq("patient_number", patient_number.trim())
    .is("deleted_at", null)
    .single();

  if (existing) {
    return Response.json(
      { error: `Patient number "${patient_number}" already exists in this trial` },
      { status: 409 }
    );
  }

  // Create patient (baseline_date will be set during enrollment)
  const { data: patient, error: createError } = await supabase
    .from("patients")
    .insert({
      trial_id: trialId,
      patient_number: patient_number.trim(),
      initials: initials?.trim() || null,
      date_of_birth: date_of_birth || null,
      sex: sex || null,
      screening_date: screening_date || null,
      notes: notes?.trim() || null,
      status: "screening",
    })
    .select()
    .single();

  if (createError) {
    console.error("[API] Error creating patient:", createError);
    return Response.json({ error: "Failed to create patient" }, { status: 500 });
  }

  // Hydrate screening visit if screening_date is provided
  let hydrationResult = null;
  if (screening_date && patient) {
    try {
      hydrationResult = await hydrateScreeningVisit(
        patient.id,
        trialId,
        screening_date
      );
      console.log("[API] Screening visit hydrated:", hydrationResult);
    } catch (hydrationError: unknown) {
      const errorMessage = hydrationError instanceof Error ? hydrationError.message : "Unknown error";
      console.error("[API] Error hydrating screening visit:", errorMessage);

      // Rollback patient creation on hydration failure
      await supabase
        .from("patients")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", patient.id);

      return Response.json(
        { error: "Failed to create screening visit: " + errorMessage },
        { status: 500 }
      );
    }
  }

  return Response.json(
    {
      ...patient,
      ...(hydrationResult && { hydration: hydrationResult }),
    },
    { status: 201 }
  );
});
