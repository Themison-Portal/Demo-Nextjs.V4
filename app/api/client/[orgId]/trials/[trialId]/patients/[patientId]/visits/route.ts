// /**
//  * Patient Visits API Route
//  * GET: Get visits for a specific patient with their activities
//  */

// import { createClient } from "@/lib/supabase/server";
// import { withTrialMember, responses } from "@/lib/api/middleware";
// import { getTrialPermissions } from "@/lib/permissions/constants";
// import type { VisitWithActivities } from "@/services/visits/types";

// /**
//  * GET /api/client/[orgId]/trials/[trialId]/patients/[patientId]/visits
//  * Get all visits for a patient with their activities
//  */
// export const GET = withTrialMember(async (req, ctx, user) => {
//   const { trialId, patientId } = ctx.params;
//   const supabase = await createClient();

//   const perms = getTrialPermissions(user.orgRole, user.trialRole);
//   if (!perms.canViewPatients) {
//     return responses.forbidden("You do not have permission to view patient visits");
//   }

//   // Verify patient exists and belongs to this trial
//   const { data: patient, error: patientError } = await supabase
//     .from("patients")
//     .select("id, trial_id")
//     .eq("id", patientId)
//     .eq("trial_id", trialId)
//     .is("deleted_at", null)
//     .single();

//   if (patientError || !patient) {
//     return Response.json({ error: "Patient not found" }, { status: 404 });
//   }

//   // Fetch visits for this patient
//   const { data: visits, error: visitsError } = await supabase
//     .from("visits")
//     .select("*")
//     .eq("patient_id", patientId)
//     .order("visit_order", { ascending: true });

//   if (visitsError) {
//     console.error("[API] Error fetching visits:", visitsError);
//     return Response.json({ error: "Failed to fetch visits" }, { status: 500 });
//   }

//   // Fetch activities for all visits in a single query
//   const visitIds = visits?.map((v) => v.id) || [];
//   let visitActivities: any[] = [];

//   if (visitIds.length > 0) {
//     const { data, error: activitiesError } = await supabase
//       .from("visit_activities")
//       .select("*")
//       .in("visit_id", visitIds)
//       .order("activity_order", { ascending: true });

//     if (activitiesError) {
//       console.error("[API] Error fetching visit activities:", activitiesError);
//       return Response.json(
//         { error: "Failed to fetch visit activities" },
//         { status: 500 }
//       );
//     }

//     visitActivities = data || [];
//   }

//   // Group activities by visit_id
//   const activitiesByVisit = visitActivities.reduce((acc, activity) => {
//     if (!acc[activity.visit_id]) {
//       acc[activity.visit_id] = [];
//     }
//     acc[activity.visit_id].push(activity);
//     return acc;
//   }, {} as Record<string, any[]>);

//   // Combine visits with their activities
//   const visitsWithActivities: VisitWithActivities[] = (visits || []).map((visit) => ({
//     ...visit,
//     activities: activitiesByVisit[visit.id] || [],
//   }));

//   return Response.json({
//     visits: visitsWithActivities,
//     total: visitsWithActivities.length,
//   });
// });
