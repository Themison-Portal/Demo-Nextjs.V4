// import { createClient } from "@/lib/supabase/server";
// import { withTrialMember, responses } from "@/lib/api/middleware";
// import { getTrialPermissions } from "@/lib/permissions/constants";
// import type { VisitScheduleTemplate } from "@/services/visits/types";

// // GET: Get trial template
// export const GET = withTrialMember(async (req, ctx, user) => {
//   const { trialId } = ctx.params;
//   const supabase = await createClient();

//   const perms = getTrialPermissions(user.orgRole, user.trialRole);
//   if (!perms.canViewTrial) {
//     return responses.forbidden("You don't have permission to view this trial");
//   }

//   const { data: trial, error } = await supabase
//     .from("trials")
//     .select("visit_schedule_template")
//     .eq("id", trialId)
//     .is("deleted_at", null)
//     .single();

//   if (error) {
//     console.error("[API] Error fetching template:", error);
//     return Response.json({ error: "Failed to fetch template" }, { status: 500 });
//   }

//   if (!trial) {
//     return Response.json({ error: "Trial not found" }, { status: 404 });
//   }

//   return Response.json({
//     template: trial.visit_schedule_template as VisitScheduleTemplate | null,
//   });
// });

// // PUT: Update trial template
// export const PUT = withTrialMember(async (req, ctx, user) => {
//   const { trialId } = ctx.params;
//   const supabase = await createClient();

//   const perms = getTrialPermissions(user.orgRole, user.trialRole);
//   if (!perms.canEditTrial) {
//     return responses.forbidden("You don't have permission to edit this trial's template");
//   }

//   let body: { template: VisitScheduleTemplate };
//   try {
//     body = await req.json();
//   } catch {
//     return Response.json({ error: "Invalid JSON body" }, { status: 400 });
//   }

//   const { template } = body;

//   // Validate basic structure
//   if (!template || typeof template !== "object") {
//     return Response.json({ error: "Template is required and must be an object" }, { status: 400 });
//   }

//   if (!Array.isArray(template.visits)) {
//     return Response.json({ error: "Template must have a visits array" }, { status: 400 });
//   }

//   if (!template.assignees || typeof template.assignees !== "object") {
//     return Response.json({ error: "Template must have an assignees object" }, { status: 400 });
//   }

//   // Validate exactly one day_zero exists
//   const dayZeroCount = template.visits.filter((v) => v.is_day_zero).length;
//   if (dayZeroCount !== 1) {
//     return Response.json(
//       {
//         error: `Template must have exactly one visit marked as day_zero, found ${dayZeroCount}`,
//       },
//       { status: 400 }
//     );
//   }

//   // Validate no duplicate visits (same order or same name)
//   const visitOrders = template.visits.map((v) => v.order);
//   const visitNames = template.visits.map((v) => v.name);

//   if (new Set(visitOrders).size !== visitOrders.length) {
//     return Response.json({ error: "Template has duplicate visit orders" }, { status: 400 });
//   }

//   if (new Set(visitNames).size !== visitNames.length) {
//     return Response.json({ error: "Template has duplicate visit names" }, { status: 400 });
//   }

//   // ============================================================================
//   // Create missing activities on-the-fly
//   // ============================================================================
//   // Collect all activity_ids from template
//   const activityIds = new Set<string>();
//   template.visits.forEach((visit) => {
//     visit.activity_ids.forEach((id) => activityIds.add(id));
//   });

//   // For each activity_id, ensure it exists in global or trial activities
//   for (const activityId of activityIds) {
//     // Check if exists in global catalog
//     const { data: globalActivity } = await supabase
//       .from("activity_types")
//       .select("id")
//       .eq("id", activityId)
//       .is("deleted_at", null)
//       .single();

//     if (globalActivity) {
//       continue; // Exists in global catalog, skip
//     }

//     // Check if exists in trial activities
//     const { data: trialActivity } = await supabase
//       .from("trial_activity_types")
//       .select("id")
//       .eq("trial_id", trialId)
//       .eq("activity_id", activityId)
//       .is("deleted_at", null)
//       .single();

//     if (trialActivity) {
//       continue; // Exists in trial activities, skip
//     }

//     // Doesn't exist anywhere, create in trial_activity_types
//     // Use activity_id as name (can be edited later)
//     const { error: createError } = await supabase
//       .from("trial_activity_types")
//       .insert({
//         trial_id: trialId,
//         activity_id: activityId,
//         name: activityId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), // "medical_history" → "Medical History"
//         category: null,
//         description: null,
//         is_custom: true,
//       });

//     if (createError) {
//       console.error(
//         `[API] Error creating activity "${activityId}":`,
//         createError
//       );
//       // Continue anyway - hydration will use activity_id as fallback
//     }
//   }

//   // ============================================================================
//   // Update template (DB constraint will also validate)
//   // ============================================================================
//   const { data: updatedTrial, error: updateError } = await supabase
//     .from("trials")
//     .update({
//       visit_schedule_template: template,
//       updated_at: new Date().toISOString(),
//     })
//     .eq("id", trialId)
//     .is("deleted_at", null)
//     .select("visit_schedule_template")
//     .single();

//   if (updateError) {
//     console.error("[API] Error updating template:", updateError);

//     // Check if it's a constraint violation
//     if (updateError.message?.includes("valid_visit_template")) {
//       return Response.json(
//         { error: "Template validation failed: " + updateError.message },
//         { status: 400 }
//       );
//     }

//     return Response.json({ error: "Failed to update template" }, { status: 500 });
//   }

//   if (!updatedTrial) {
//     return Response.json({ error: "Trial not found" }, { status: 404 });
//   }

//   return Response.json({
//     template: updatedTrial.visit_schedule_template as VisitScheduleTemplate,
//   });
// });

import { withTrialMember, responses } from "@/lib/api/middleware";
import type { VisitScheduleTemplate } from "@/services/visits/types";

/**
 * GET: Fetch trial visit schedule template
 */
export const GET = withTrialMember(async (req, ctx, user) => {
    const { trialId } = ctx.params;

    try {
        // FIXED: correct backend endpoint
        const res = await fetch(`/api/backend/trials/${trialId}/template`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
            if (res.status === 404) return responses.notFound("Trial not found");
            if (res.status === 403) return responses.forbidden("Access denied");
            return Response.json({ error: "Failed to fetch template" }, { status: res.status });
        }

        // Backend already returns VisitScheduleTemplate directly
        const data: VisitScheduleTemplate = await res.json();

        return Response.json({ template: data });
    } catch (err) {
        console.error("[API] Error fetching template:", err);
        return Response.json({ error: "Failed to fetch template" }, { status: 500 });
    }
});

/**
 * PUT: Update trial visit schedule template
 */
export const PUT = withTrialMember(async (req, ctx, user) => {
    const { trialId } = ctx.params;

    let body: VisitScheduleTemplate;
    try {
        // FIXED: expect template directly (not { template: ... })
        body = await req.json();
    } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    try {
        const res = await fetch(`/api/backend/trials/${trialId}/template`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            // FIXED: send template directly
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            if (res.status === 404) return responses.notFound("Trial not found");
            if (res.status === 403) return responses.forbidden("Access denied");

            const errData = await res.json();
            return Response.json(
                { error: errData.detail || "Failed to update template" },
                { status: res.status }
            );
        }

        // Backend returns template directly
        const data: VisitScheduleTemplate = await res.json();

        return Response.json({ template: data });
    } catch (err) {
        console.error("[API] Error updating template:", err);
        return Response.json({ error: "Failed to update template" }, { status: 500 });
    }
});