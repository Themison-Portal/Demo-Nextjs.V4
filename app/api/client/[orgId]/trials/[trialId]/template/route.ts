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