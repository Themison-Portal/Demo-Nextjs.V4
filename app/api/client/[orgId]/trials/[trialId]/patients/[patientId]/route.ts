// import { createClient } from "@/lib/supabase/server";
// import { withTrialMember, responses } from "@/lib/api/middleware";
// import { getTrialPermissions } from "@/lib/permissions/constants";
// import { PATIENT_CONSTANTS } from "@/lib/constants";

// // GET: Ver patient
// export const GET = withTrialMember(async (req, ctx, user) => {
//   const { trialId, patientId } = ctx.params;
//   const supabase = await createClient();

//   const perms = getTrialPermissions(user.orgRole, user.trialRole);
//   if (!perms.canViewPatients) {
//     return responses.forbidden("No tienes permiso para ver pacientes");
//   }

//   const { data: patient, error } = await supabase
//     .from("patients")
//     .select("*")
//     .eq("id", patientId)
//     .eq("trial_id", trialId)
//     .is("deleted_at", null)
//     .single();

//   if (error || !patient) {
//     return Response.json({ error: "Patient not found" }, { status: 404 });
//   }

//   return Response.json(patient);
// });

// // PATCH: Actualizar patient
// export const PATCH = withTrialMember(async (req, ctx, user) => {
//   const { trialId, patientId } = ctx.params;
//   const supabase = await createClient();

//   const perms = getTrialPermissions(user.orgRole, user.trialRole);
//   if (!perms.canManagePatients) {
//     return responses.forbidden("No tienes permiso para editar pacientes");
//   }

//   let body;
//   try {
//     body = await req.json();
//   } catch {
//     return Response.json({ error: "Invalid JSON body" }, { status: 400 });
//   }

//   // Verify patient exists
//   const { data: existing } = await supabase
//     .from("patients")
//     .select("id, trial_id")
//     .eq("id", patientId)
//     .eq("trial_id", trialId)
//     .is("deleted_at", null)
//     .single();

//   if (!existing) {
//     return Response.json({ error: "Patient not found" }, { status: 404 });
//   }

//   // Build update object con campos permitidos
//   const allowedFields = [
//     "patient_number", "initials", "date_of_birth", "sex",
//     "enrollment_date", "status", "visit_start_date", "notes"
//   ];

//   const updateData: Record<string, any> = {};
//   for (const field of allowedFields) {
//     if (field in body) {
//       updateData[field] = field !== "patient_number" && body[field] === "" ? null : body[field];
//     }
//   }

//   // Validate patient_number if exists
//   if ("patient_number" in updateData) {
//     if (!updateData.patient_number || updateData.patient_number.trim() === "") {
//       return Response.json({ error: "Patient number cannot be empty" }, { status: 400 });
//     }

//     // Verify duplicate
//     const { data: duplicate } = await supabase
//       .from("patients")
//       .select("id")
//       .eq("trial_id", trialId)
//       .eq("patient_number", updateData.patient_number.trim())
//       .neq("id", patientId)
//       .is("deleted_at", null)
//       .single();

//     if (duplicate) {
//       return Response.json(
//         { error: `Patient number "${updateData.patient_number}" already exists` },
//         { status: 409 }
//       );
//     }
//   }

//   // Validate sex
//   if (updateData.sex && !PATIENT_CONSTANTS.sex.includes(updateData.sex)) {
//     return Response.json({ error: "Invalid sex value" }, { status: 400 });
//   }

//   // Validate status
//   if (updateData.status) {
//     if (!PATIENT_CONSTANTS.status.includes(updateData.status)) {
//       return Response.json({ error: "Invalid status value" }, { status: 400 });
//     }

//     // Only allow manual setting of withdrawn/screen_failed
//     // screening/enrolled/completed are auto-calculated
//     if (PATIENT_CONSTANTS.autoCalculatedStatuses.includes(updateData.status as any)) {
//       return Response.json({
//         error: "Status 'screening', 'enrolled', and 'completed' are auto-calculated and cannot be set manually"
//       }, { status: 400 });
//     }
//   }

//   // Auto-calculate status based on randomization_date
//   if ('randomization_date' in updateData && !updateData.status) {
//     if (updateData.randomization_date !== null) {
//       // Patient was randomized → enrolled
//       updateData.status = 'enrolled';
//     }
//   }

//   // Update
//   const { data: updatedPatient, error: updateError } = await supabase
//     .from("patients")
//     .update(updateData)
//     .eq("id", patientId)
//     .select()
//     .single();

//   if (updateError) {
//     console.error("[API] Error updating patient:", updateError);
//     return Response.json({ error: "Failed to update patient" }, { status: 500 });
//   }

//   return Response.json(updatedPatient);
// });

// // DELETE: Soft delete
// export const DELETE = withTrialMember(async (req, ctx, user) => {
//   const { trialId, patientId } = ctx.params;
//   const supabase = await createClient();

//   const perms = getTrialPermissions(user.orgRole, user.trialRole);
//   if (!perms.canManagePatients) {
//     return responses.forbidden("No tienes permiso para eliminar pacientes");
//   }

//   const { error } = await supabase
//     .from("patients")
//     .update({ deleted_at: new Date().toISOString() })
//     .eq("id", patientId)
//     .eq("trial_id", trialId);

//   if (error) {
//     console.error("[API] Error deleting patient:", error);
//     return Response.json({ error: "Failed to delete patient" }, { status: 500 });
//   }

//   return Response.json({ success: true });
// });
