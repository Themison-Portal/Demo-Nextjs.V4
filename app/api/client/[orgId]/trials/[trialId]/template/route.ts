import { createClient } from "@/lib/supabase/server";
import { withTrialMember, responses } from "@/lib/api/middleware";
import { getTrialPermissions } from "@/lib/permissions/constants";
import type { VisitScheduleTemplate } from "@/services/visits/types";

// GET: Get trial template
export const GET = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  const supabase = await createClient();

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canViewTrial) {
    return responses.forbidden("You don't have permission to view this trial");
  }

  const { data: trial, error } = await supabase
    .from("trials")
    .select("visit_schedule_template")
    .eq("id", trialId)
    .is("deleted_at", null)
    .single();

  if (error) {
    console.error("[API] Error fetching template:", error);
    return Response.json({ error: "Failed to fetch template" }, { status: 500 });
  }

  if (!trial) {
    return Response.json({ error: "Trial not found" }, { status: 404 });
  }

  return Response.json({
    template: trial.visit_schedule_template as VisitScheduleTemplate | null,
  });
});

// PUT: Update trial template
export const PUT = withTrialMember(async (req, ctx, user) => {
  const { trialId } = ctx.params;
  const supabase = await createClient();

  const perms = getTrialPermissions(user.orgRole, user.trialRole);
  if (!perms.canEditTrial) {
    return responses.forbidden("You don't have permission to edit this trial's template");
  }

  let body: { template: VisitScheduleTemplate };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { template } = body;

  // Validar estructura básica
  if (!template || typeof template !== "object") {
    return Response.json({ error: "Template is required and must be an object" }, { status: 400 });
  }

  if (!Array.isArray(template.visits)) {
    return Response.json({ error: "Template must have a visits array" }, { status: 400 });
  }

  if (!template.assignees || typeof template.assignees !== "object") {
    return Response.json({ error: "Template must have an assignees object" }, { status: 400 });
  }

  // Validar que haya exactamente un day_zero
  const dayZeroCount = template.visits.filter((v) => v.is_day_zero).length;
  if (dayZeroCount !== 1) {
    return Response.json(
      {
        error: `Template must have exactly one visit marked as day_zero, found ${dayZeroCount}`,
      },
      { status: 400 }
    );
  }

  // Validar que no haya visits duplicadas (mismo order o mismo name)
  const visitOrders = template.visits.map((v) => v.order);
  const visitNames = template.visits.map((v) => v.name);

  if (new Set(visitOrders).size !== visitOrders.length) {
    return Response.json({ error: "Template has duplicate visit orders" }, { status: 400 });
  }

  if (new Set(visitNames).size !== visitNames.length) {
    return Response.json({ error: "Template has duplicate visit names" }, { status: 400 });
  }

  // Actualizar template (DB constraint también validará)
  const { data: updatedTrial, error: updateError } = await supabase
    .from("trials")
    .update({
      visit_schedule_template: template,
      updated_at: new Date().toISOString(),
    })
    .eq("id", trialId)
    .is("deleted_at", null)
    .select("visit_schedule_template")
    .single();

  if (updateError) {
    console.error("[API] Error updating template:", updateError);

    // Check if it's a constraint violation
    if (updateError.message?.includes("valid_visit_template")) {
      return Response.json(
        { error: "Template validation failed: " + updateError.message },
        { status: 400 }
      );
    }

    return Response.json({ error: "Failed to update template" }, { status: 500 });
  }

  if (!updatedTrial) {
    return Response.json({ error: "Trial not found" }, { status: 404 });
  }

  return Response.json({
    template: updatedTrial.visit_schedule_template as VisitScheduleTemplate,
  });
});
