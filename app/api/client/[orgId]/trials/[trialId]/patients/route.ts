import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import { hydrateVisitSchedule } from "@/services/visits/hydration";
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

  // Validar patient_number requerido
  if (!patient_number || patient_number.trim() === "") {
    return Response.json({ error: "Patient number is required" }, { status: 400 });
  }

  // Validar sex si existe
  if (sex && !PATIENT_CONSTANTS.sex.includes(sex)) {
    return Response.json({ error: "Invalid sex value" }, { status: 400 });
  }

  // Verificar trial existe y obtener template
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

  // Calculate visit_start_date from screening_date
  let visit_start_date: string | null = null;
  if (screening_date && trial.visit_schedule_template) {
    const template = trial.visit_schedule_template as any;
    const visits = template?.visits || [];

    if (visits.length === 0) {
      return Response.json(
        { error: "Trial has no visit schedule template defined" },
        { status: 400 }
      );
    }

    // Find the visit with the lowest days_from_day_zero (typically the screening visit)
    const screeningVisit = visits.reduce((min: any, visit: any) => {
      const currentOffset = visit.days_from_day_zero ?? 0;
      const minOffset = min.days_from_day_zero ?? 0;
      return currentOffset < minOffset ? visit : min;
    }, visits[0]);

    const screeningOffset = screeningVisit.days_from_day_zero ?? 0;

    // Calculate Day 0 (Baseline): visit_start_date = screening_date - screening_offset
    // Example: screening_date = 2026-01-20, screening_offset = -28
    // visit_start_date = 2026-01-20 - (-28) = 2026-01-20 + 28 = 2026-02-17
    const screeningDateObj = new Date(screening_date);
    const visitStartDateObj = new Date(screeningDateObj);
    visitStartDateObj.setDate(visitStartDateObj.getDate() - screeningOffset);

    // Format as YYYY-MM-DD
    visit_start_date = visitStartDateObj.toISOString().split('T')[0];
  }

  // Verificar patient_number único en este trial
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

  // Create patient with calculated visit_start_date (Day 0/Baseline)
  // If screening_date was not provided, visit_start_date will be null and hydration won't run
  const { data: patient, error: createError } = await supabase
    .from("patients")
    .insert({
      trial_id: trialId,
      patient_number: patient_number.trim(),
      initials: initials?.trim() || null,
      date_of_birth: date_of_birth || null,
      sex: sex || null,
      screening_date: screening_date || null,
      visit_start_date: visit_start_date || null,
      notes: notes?.trim() || null,
      status: "screening",
    })
    .select()
    .single();

  if (createError) {
    console.error("[API] Error creating patient:", createError);
    return Response.json({ error: "Failed to create patient" }, { status: 500 });
  }

  // Hydrate visit schedule if visit_start_date is provided
  let hydrationResult = null;
  if (visit_start_date && patient) {
    try {
      hydrationResult = await hydrateVisitSchedule(
        patient.id,
        trialId,
        visit_start_date
      );
      console.log("[API] Visit schedule hydrated:", hydrationResult);
    } catch (hydrationError: unknown) {
      // Log error but don't fail patient creation
      // The patient exists, but schedule wasn't generated
      // This could happen if trial has no template
      const errorMessage = hydrationError instanceof Error ? hydrationError.message : "Unknown error";
      console.error("[API] Error hydrating visit schedule:", errorMessage);

      // Optionally, you could rollback the patient creation here
      // For now, we'll just log and continue
      // TODO: Decide on rollback strategy
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
