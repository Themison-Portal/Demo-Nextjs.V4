// /**
//  * Client - Complete Visit API Route
//  * POST: Manually complete a visit
//  */

// import { createClient } from "@/lib/supabase/server";
// import { withTrialMember } from "@/lib/api/middleware";
// import { isCriticalTrialRole } from "@/lib/permissions/constants";

// /**
//  * POST /api/client/[orgId]/trials/[trialId]/patients/[patientId]/visits/[visitId]/complete
//  * Manually complete a visit
//  *
//  * Permissions:
//  * - Only PI/CRC can complete visits (critical clinical milestone)
//  *
//  * Validation:
//  * - All activities must be 'completed' or 'not_applicable'
//  * - Returns error if visit is already completed or has pending activities
//  */
// export const POST = withTrialMember(async (req, ctx, user) => {
//   const { visitId } = ctx.params;
//   const supabase = await createClient();

//   // Check permissions: only PI/CRC can complete visits
//   const canCompleteVisits = user.trialRole && isCriticalTrialRole(user.trialRole);
//   if (!canCompleteVisits) {
//     return Response.json(
//       { error: "Only PI and CRC can complete visits" },
//       { status: 403 }
//     );
//   }

//   // Get visit with its activities
//   const { data: visit, error: visitError } = await supabase
//     .from("visits")
//     .select(`
//       id,
//       patient_id,
//       visit_name,
//       status
//     `)
//     .eq("id", visitId)
//     .single();

//   if (visitError || !visit) {
//     return Response.json({ error: "Visit not found" }, { status: 404 });
//   }

//   // Check if visit is already completed
//   if (visit.status === 'completed') {
//     return Response.json(
//       { error: "Visit is already completed" },
//       { status: 400 }
//     );
//   }

//   // Get all activities for this visit
//   const { data: activities, error: activitiesError } = await supabase
//     .from("visit_activities")
//     .select("id, activity_name, status")
//     .eq("visit_id", visitId);

//   if (activitiesError) {
//     console.error("[API] Error fetching activities:", activitiesError);
//     return Response.json(
//       { error: "Failed to fetch visit activities" },
//       { status: 500 }
//     );
//   }

//   // Validate all activities are done
//   const pendingActivities = activities?.filter(
//     (a) => a.status === 'pending'
//   ) || [];

//   if (pendingActivities.length > 0) {
//     return Response.json(
//       {
//         error: "Cannot complete visit with pending activities",
//         pending_activities: pendingActivities.map(a => a.activity_name),
//         details: `${pendingActivities.length} activities still pending`
//       },
//       { status: 400 }
//     );
//   }

//   // Complete the visit
//   const { data: completedVisit, error: updateError } = await supabase
//     .from("visits")
//     .update({
//       status: 'completed',
//       actual_date: new Date().toISOString().split('T')[0], // Today's date
//       updated_at: new Date().toISOString()
//     })
//     .eq("id", visitId)
//     .select()
//     .single();

//   if (updateError) {
//     console.error("[API] Error completing visit:", updateError);
//     return Response.json(
//       { error: "Failed to complete visit" },
//       { status: 500 }
//     );
//   }

//   return Response.json({
//     visit: completedVisit,
//     message: `Visit "${visit.visit_name}" completed successfully`
//   });
// });
