import type { VisitTemplate } from "./types";
import type { HydrationResult, RecalculationResult } from "./types";
import type {
    EnrollmentPreview,
    EnrollmentVisitPreview,
    EnrollmentActivityPreview,
} from "@/services/patients/types";
import { apiClient } from "@/lib/apiClient"; // FastAPI client
import type { TrialDetails } from "@/services/trials/types";
import { VisitScheduleTemplate } from '@/services/trials/types';
import type { VisitScheduleTemplateWithAssignees } from "@/services/trials/types";

// ============================================================================
// Helpers
// ============================================================================

/**
 * Get user_id by trial role
 */
async function getUserByTrialRole(
    trialId: string,
    role: string
): Promise<string | null> {
    const members = await apiClient.getTrialTeamMembers(trialId);

    const member = members.find((m) => m.role_name === role);

    return member?.member_id ?? null;
}

/**
 * Resolve activity name from trial_activity_types → activity_types → fallback
 */
async function resolveActivityName(trialId: string, activityId: string): Promise<string> {
    const trialActivity = await apiClient.getTrialActivity(trialId, activityId);
    if (trialActivity?.name) return trialActivity.name;

    const globalActivity = await apiClient.getActivityType(activityId);
    return globalActivity?.name || activityId;
}

/**
 * Get trial template or throw
 */
async function getTrialTemplate(trialId: string): Promise<VisitScheduleTemplate[]> {
    const trial = await apiClient.getTrialById(trialId) as TrialDetails;

    if (!trial?.visit_schedules?.length) {
        throw new Error(`Trial ${trialId} has no visit schedule template`);
    }

    return trial.visit_schedules;
}

/**
 * Resolve assignee user_id for an activity, considering overrides
 */
async function resolveAssignee(
    trialId: string,
    activityId: string,
    visitOrder: number,
    assignees: Record<string, string>,
    overrides?: Record<string, string | null>
): Promise<string | null> {
    if (overrides) {
        const visitKey = `v${visitOrder}-${activityId}`;
        const overrideValue = overrides[visitKey] ?? overrides[activityId];
        if (overrideValue !== undefined) {
            if (!overrideValue || overrideValue === "null") return null;
            return overrideValue;
        }
    }

    const role = assignees[activityId];
    if (!role) return null;

    return getUserByTrialRole(trialId, role);
}

// ============================================================================
// Core hydration logic for a single visit
// ============================================================================

async function hydrateVisitFromTemplate(
    trialId: string,
    patientId: string,
    visit: VisitTemplate,
    scheduledDate: string,
    template: VisitScheduleTemplate,
    overrides?: Record<string, string | null>
): Promise<{ activitiesCreated: number; tasksCreated: number }> {
    const visitRecord = await apiClient.createVisit({
        patient_id: patientId,
        visit_template_name: visit.name,
        visit_name: visit.name,
        visit_order: visit.order,
        days_from_day_zero: visit.days_from_day_zero,
        is_day_zero: visit.is_day_zero ?? false,
        scheduled_date: scheduledDate,
        status: "scheduled",
    });

    let activitiesCreated = 0;
    let tasksCreated = 0;

    for (let i = 0; i < (visit.activity_ids?.length ?? 0); i++) {
        const activityId = visit.activity_ids[i];
        const activityOrder = i + 1;
        const activityName = await resolveActivityName(trialId, activityId);

        const activityRecord = await apiClient.createVisitActivity({
            visit_id: visitRecord.id,
            activity_type_id: activityId,
            activity_name: activityName,
            activity_order: activityOrder,
            status: "pending",
        });

        activitiesCreated++;

        const template = trial.visit_schedules as VisitScheduleTemplateWithAssignees;

        const assigneeUserId = await resolveAssignee(
            trialId,
            activityId,
            visit.order,
            template.assignees,
            overrides
        );

        await apiClient.createTask({
            trial_id: trialId,
            patient_id: patientId,
            visit_id: visitRecord.id,
            visit_activity_id: activityRecord.id,
            activity_type_id: activityId,
            title: `${activityName} - ${visit.name}`,
            status: "todo",
            assigned_to: assigneeUserId ?? undefined,
            due_date: scheduledDate,
            source: "visit",
            source_id: visitRecord.id,
        });

        tasksCreated++;
    }

    return { activitiesCreated, tasksCreated };
}

// ============================================================================
// Public API
// ============================================================================

export async function hydrateScreeningVisit(
    patientId: string,
    trialId: string,
    screeningDate: string
): Promise<HydrationResult & { baseline_deadline_date: string }> {
    const template = await getTrialTemplate(trialId);

    const screeningVisit = template.visits.find((v) => v.order === 1 && !v.is_day_zero);
    if (!screeningVisit) throw new Error("Template must have a screening visit (order=1)");

    const dayZeroVisit = template.visits.find((v) => v.is_day_zero);
    if (!dayZeroVisit) throw new Error("Template must have a day_zero visit");

    const windowDays = Math.abs(dayZeroVisit.days_from_day_zero - screeningVisit.days_from_day_zero);
    const screeningDateObj = new Date(screeningDate);
    const baselineDeadline = new Date(screeningDateObj);
    baselineDeadline.setDate(baselineDeadline.getDate() + windowDays);
    const baselineDeadlineStr = baselineDeadline.toISOString().split("T")[0];

    await apiClient.updatePatient(patientId, { baseline_deadline_date: baselineDeadlineStr });

    const { activitiesCreated, tasksCreated } = await hydrateVisitFromTemplate(
        trialId,
        patientId,
        screeningVisit,
        screeningDate,
        template
    );

    return {
        visits_created: 1,
        activities_created: activitiesCreated,
        tasks_created: tasksCreated,
        patient_id: patientId,
        trial_id: trialId,
        baseline_deadline_date: baselineDeadlineStr,
    };
}

export async function hydrateRemainingVisits(
    patientId: string,
    trialId: string,
    baselineDate: string,
    assigneeOverrides?: Record<string, string | null>
): Promise<HydrationResult> {
    const template = await getTrialTemplate(trialId);
    const remainingVisits = template.visits.filter((v) => v.order > 1).sort((a, b) => a.order - b.order);
    const baselineDateObj = new Date(baselineDate);

    let visitsCreated = 0;
    let activitiesCreated = 0;
    let tasksCreated = 0;

    for (const visit of remainingVisits) {
        const scheduledDateObj = new Date(baselineDateObj);
        scheduledDateObj.setDate(scheduledDateObj.getDate() + visit.days_from_day_zero);
        const scheduledDate = scheduledDateObj.toISOString().split("T")[0];

        const result = await hydrateVisitFromTemplate(
            trialId,
            patientId,
            visit,
            scheduledDate,
            template,
            assigneeOverrides
        );

        visitsCreated++;
        activitiesCreated += result.activitiesCreated;
        tasksCreated += result.tasksCreated;
    }

    return { visits_created: visitsCreated, activities_created: activitiesCreated, tasks_created: tasksCreated, patient_id: patientId, trial_id: trialId };
}

export async function previewEnrollment(
    patientId: string,
    trialId: string,
    baselineDate: string
): Promise<EnrollmentPreview> {
    const template = await getTrialTemplate(trialId);
    const remainingVisits = template.visits.filter((v: any) => v.order > 1).sort((a: any, b: any) => a.order - b.order);
    const baselineDateObj = new Date(baselineDate);

    const visitsPreview: EnrollmentVisitPreview[] = [];
    let totalActivities = 0;

    for (const visit of remainingVisits) {
        const scheduledDateObj = new Date(baselineDateObj);
        scheduledDateObj.setDate(scheduledDateObj.getDate() + visit.days_from_day_zero);
        const scheduledDate = scheduledDateObj.toISOString().split("T")[0];

        const activitiesPreview: EnrollmentActivityPreview[] = [];

        for (const activityId of visit.activity_ids ?? []) {
            const activityName = await resolveActivityName(trialId, activityId);
            const role = template.assignees[activityId] ?? null;

            let assigneeUserId: string | null = null;
            let assigneeUser: { id: string; name: string; email: string } | null = null;

            if (role) {
                const members = await apiClient.getTrialTeamMembers(trialId);
                const member = members.find((m) => m.role === role);
                if (member) {
                    assigneeUserId = member.user_id;
                    assigneeUser = { id: member.user_id, name: member.full_name, email: member.email };
                }
            }

            activitiesPreview.push({ activity_id: activityId, activity_name: activityName, assigned_to_role: role, assigned_to_user_id: assigneeUserId, assigned_to_user: assigneeUser });
            totalActivities++;
        }

        visitsPreview.push({ name: visit.name, order: visit.order, scheduled_date: scheduledDate, days_from_day_zero: visit.days_from_day_zero, is_day_zero: visit.is_day_zero ?? false, activities: activitiesPreview });
    }

    return { visits: visitsPreview, total_visits: visitsPreview.length, total_activities: totalActivities, baseline_date: baselineDate };
}

export async function recalculateVisitSchedule(
    patientId: string,
    newVisitStartDate: string
): Promise<RecalculationResult> {
    const visits = (await apiClient.getPatientVisits(patientId)) as Array<{ id: string; days_from_day_zero?: number }>;
    const startDate = new Date(newVisitStartDate);

    let visitsUpdated = 0;
    let tasksUpdated = 0;

    for (const visit of visits) {
        const newScheduledDate = new Date(startDate);
        newScheduledDate.setDate(newScheduledDate.getDate() + (visit.days_from_day_zero ?? 0));
        const scheduledDateStr = newScheduledDate.toISOString().split("T")[0];

        await apiClient.updateVisit(visit.id, { scheduled_date: scheduledDateStr });
        visitsUpdated++;

        const tasksCount = await apiClient.updateTasksByVisit(patientId, visit.id, { due_date: scheduledDateStr });
        tasksUpdated += tasksCount;
    }

    return { visits_updated: visitsUpdated, tasks_updated: tasksUpdated, patient_id: patientId, new_visit_start_date: newVisitStartDate };
}