import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";

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

  const { patient_number, initials, date_of_birth, sex, enrollment_date, visit_start_date, notes } = body;

  // Validar patient_number requerido
  if (!patient_number || patient_number.trim() === "") {
    return Response.json({ error: "Patient number is required" }, { status: 400 });
  }

  // Validar sex si existe
  const validSex = ["male", "female", "other"];
  if (sex && !validSex.includes(sex)) {
    return Response.json({ error: "Invalid sex value" }, { status: 400 });
  }

  // Verificar trial existe
  const { data: trial } = await supabase
    .from("trials")
    .select("id")
    .eq("id", trialId)
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .single();

  if (!trial) {
    return Response.json({ error: "Trial not found" }, { status: 404 });
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

  // Crear patient
  const { data: patient, error: createError } = await supabase
    .from("patients")
    .insert({
      trial_id: trialId,
      patient_number: patient_number.trim(),
      initials: initials?.trim() || null,
      date_of_birth: date_of_birth || null,
      sex: sex || null,
      enrollment_date: enrollment_date || null,
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

  return Response.json(patient, { status: 201 });
});
