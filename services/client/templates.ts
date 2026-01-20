import type {
  VisitScheduleTemplate,
  UpdateVisitTemplateInput,
} from "@/services/visits/types";

interface GetTemplateResponse {
  template: VisitScheduleTemplate | null;
}

interface UpdateTemplateResponse {
  template: VisitScheduleTemplate;
}

/**
 * Get visit schedule template for a trial
 */
export async function getVisitTemplate(
  orgId: string,
  trialId: string
): Promise<GetTemplateResponse> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/template`,
    { method: "GET", credentials: "include" }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch visit template");
  }

  return response.json();
}

/**
 * Update visit schedule template for a trial
 */
export async function updateVisitTemplate(
  orgId: string,
  trialId: string,
  template: VisitScheduleTemplate
): Promise<UpdateTemplateResponse> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/template`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ template }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update visit template");
  }

  return response.json();
}
