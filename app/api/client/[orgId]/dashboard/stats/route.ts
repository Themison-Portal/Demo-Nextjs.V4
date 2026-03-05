/**
 * Dashboard Stats API Route
 * GET: Aggregated statistics for organization dashboard
 * Uses Auth0 API client for fetching data
 */

import { withOrgMember } from "@/lib/api/middleware";
import { apiClient } from "@/lib/apiClient"; // Auth0 API client wrapper

type TrialStatus = "active" | "paused" | "completed" | "terminated";
type PatientStatus = "screening" | "enrolled" | "completed" | "withdrawn" | "screen_failed";
type TaskStatus = "todo" | "in_progress" | "completed" | "blocked";

export interface DashboardStats {
    trials: {
        total: number;
        byStatus: Record<TrialStatus, number>;
    };
    patients: {
        total: number;
        byStatus: Record<PatientStatus, number>;
    };
    tasks: {
        total: number;
        byStatus: Record<TaskStatus, number>;
        overdue: number;
        byAssignee: Array<{
            user_id: string;
            user_name: string;
            count: number;
        }>;
    };
    teamMembers: {
        total: number;
    };
    timeline: Array<{
        week: string;
        visits: number;
        tasks: number;
    }>;
}

/**
 * GET /api/client/dashboard/stats
 * Aggregated dashboard stats for the organization
 */
export const GET = withOrgMember(async (_req, _ctx, _user) => {
    try {
        // Fetch data via API client
        const trials = await apiClient.getTrials();
        const trialIds = trials.map((t: any) => t.id);

        const patients = trialIds.length > 0 ? await apiClient.getPatients() : [];
        const tasks = trialIds.length > 0 ? await apiClient.getTasks(trialIds) : [];
        const visits = trialIds.length > 0 ? await apiClient.getVisits(trialIds) : [];
        const teamMembersCount = await apiClient.getTeamMemberCount();

        // -------------------
        // Aggregate trial stats
        // -------------------
        const trialsByStatus: Record<string, number> = { active: 0, paused: 0, completed: 0, terminated: 0 };
        trials.forEach((trial: any) => {
            if (trial.status) trialsByStatus[trial.status] = (trialsByStatus[trial.status] || 0) + 1;
        });

        // -------------------
        // Aggregate patient stats
        // -------------------
        const patientsByStatus: Record<string, number> = { screening: 0, enrolled: 0, completed: 0, withdrawn: 0, screen_failed: 0 };
        patients.forEach((p: any) => {
            if (p.status) patientsByStatus[p.status] = (patientsByStatus[p.status] || 0) + 1;
        });

        // -------------------
        // Aggregate task stats
        // -------------------
        const tasksByStatus: Record<string, number> = { todo: 0, in_progress: 0, completed: 0, blocked: 0 };
        let overdueCount = 0;
        const tasksByAssignee: Record<string, { user_id: string; user_name: string; count: number }> = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        tasks.forEach((task: any) => {
            if (task.status) tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;

            if (task.status !== "completed" && task.due_date && new Date(task.due_date) < today) overdueCount++;

            if (task.assigned_to && task.assigned_user) {
                if (!tasksByAssignee[task.assigned_to]) {
                    tasksByAssignee[task.assigned_to] = {
                        user_id: task.assigned_to,
                        user_name: task.assigned_user.full_name || "Unknown",
                        count: 0,
                    };
                }
                tasksByAssignee[task.assigned_to].count++;
            }
        });

        const tasksByAssigneeArray = Object.values(tasksByAssignee).sort((a, b) => b.count - a.count);

        // -------------------
        // Build timeline (next 12 weeks)
        // -------------------
        const timelineMap: Record<string, { week: string; visits: number; tasks: number }> = {};
        const getWeekStart = (date: Date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            d.setDate(diff);
            return d;
        };
        const formatWeekLabel = (date: Date) => {
            const month = date.toLocaleDateString("en-US", { month: "short" });
            const day = date.getDate();
            return `${month} ${day}`;
        };

        const currentDate = new Date();
        for (let i = 0; i < 12; i++) {
            const weekStart = getWeekStart(new Date(currentDate.getTime() + i * 7 * 24 * 60 * 60 * 1000));
            const weekKey = weekStart.toISOString().split("T")[0];
            timelineMap[weekKey] = { week: formatWeekLabel(weekStart), visits: 0, tasks: 0 };
        }

        visits.forEach((visit: any) => {
            if (visit.visit_date || visit.scheduled_date) {
                const date = new Date(visit.visit_date || visit.scheduled_date);
                const weekStart = getWeekStart(date);
                const weekKey = weekStart.toISOString().split("T")[0];
                if (timelineMap[weekKey]) timelineMap[weekKey].visits++;
            }
        });

        tasks.forEach((task: any) => {
            if (task.due_date && task.status !== "completed" && new Date(task.due_date) >= today) {
                const weekStart = getWeekStart(new Date(task.due_date));
                const weekKey = weekStart.toISOString().split("T")[0];
                if (timelineMap[weekKey]) timelineMap[weekKey].tasks++;
            }
        });

        const timeline = Object.keys(timelineMap).sort().map(key => timelineMap[key]);

        // -------------------
        // Build response
        // -------------------
        const stats: DashboardStats = {
            trials: { total: trials.length, byStatus: trialsByStatus as Record<TrialStatus, number> },
            patients: { total: patients.length, byStatus: patientsByStatus as Record<PatientStatus, number> },
            tasks: { total: tasks.length, byStatus: tasksByStatus as Record<TaskStatus, number>, overdue: overdueCount, byAssignee: tasksByAssigneeArray },
            teamMembers: { total: teamMembersCount },
            timeline,
        };

        return Response.json(stats);
    } catch (err: any) {
        console.error("[API] Dashboard stats error:", err);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
});