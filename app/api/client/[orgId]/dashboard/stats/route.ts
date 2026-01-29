/**
 * Dashboard Stats API Route
 * GET: Aggregated statistics for organization dashboard
 */

import { createClient } from "@/lib/supabase/server";
import { withOrgMember } from "@/lib/api/middleware";
import type { Database } from "@/lib/supabase/database.types";

type TrialStatus = Database["public"]["Tables"]["trials"]["Row"]["status"];
type PatientStatus = Database["public"]["Tables"]["patients"]["Row"]["status"];
type TaskStatus = Database["public"]["Tables"]["tasks"]["Row"]["status"];

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
 * GET /api/client/[orgId]/dashboard/stats
 * Get aggregated dashboard statistics for organization
 *
 * Access: Any organization member
 */
export const GET = withOrgMember(async (req, ctx, user) => {
  const { orgId } = ctx.params;
  const supabase = await createClient();

  try {
    // Fetch all trials for the org
    const { data: trials, error: trialsError } = await supabase
      .from("trials")
      .select("id, status")
      .eq("org_id", orgId)
      .is("deleted_at", null);

    if (trialsError) {
      console.error("[API] Error fetching trials:", trialsError);
      return Response.json(
        { error: "Failed to fetch trials" },
        { status: 500 }
      );
    }

    // Get trial IDs for filtering patients and tasks
    const trialIds = (trials || []).map((t) => t.id);

    // Fetch patients for all trials
    let patientsQuery = supabase
      .from("patients")
      .select("id, status")
      .is("deleted_at", null);

    if (trialIds.length > 0) {
      patientsQuery = patientsQuery.in("trial_id", trialIds);
    }

    const { data: patients, error: patientsError } = await patientsQuery;

    if (patientsError) {
      console.error("[API] Error fetching patients:", patientsError);
      return Response.json(
        { error: "Failed to fetch patients" },
        { status: 500 }
      );
    }

    // Fetch tasks for all trials
    let tasksQuery = supabase
      .from("tasks")
      .select(
        `
        id,
        status,
        due_date,
        assigned_to,
        assigned_user:users!tasks_assigned_to_fkey (
          id,
          full_name
        )
      `
      )
      .is("deleted_at", null);

    if (trialIds.length > 0) {
      tasksQuery = tasksQuery.in("trial_id", trialIds);
    }

    const { data: tasks, error: tasksError } = await tasksQuery;

    if (tasksError) {
      console.error("[API] Error fetching tasks:", tasksError);
      return Response.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    // Fetch team members count
    const { count: teamMemberCount, error: teamError } = await supabase
      .from("organization_members")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .is("deleted_at", null);

    if (teamError) {
      console.error("[API] Error fetching team members:", teamError);
      return Response.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    // Aggregate trial stats by status
    const trialsByStatus: Record<string, number> = {
      active: 0,
      paused: 0,
      completed: 0,
      terminated: 0,
    };

    (trials || []).forEach((trial) => {
      if (trial.status) {
        trialsByStatus[trial.status] = (trialsByStatus[trial.status] || 0) + 1;
      }
    });

    // Aggregate patient stats by status
    const patientsByStatus: Record<string, number> = {
      screening: 0,
      enrolled: 0,
      completed: 0,
      withdrawn: 0,
      screen_failed: 0,
    };

    (patients || []).forEach((patient) => {
      if (patient.status) {
        patientsByStatus[patient.status] =
          (patientsByStatus[patient.status] || 0) + 1;
      }
    });

    // Aggregate task stats
    const tasksByStatus: Record<string, number> = {
      todo: 0,
      in_progress: 0,
      completed: 0,
      blocked: 0,
    };

    let overdueCount = 0;
    const tasksByAssignee: Record<
      string,
      { user_id: string; user_name: string; count: number }
    > = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    (tasks || []).forEach((task: any) => {
      // Count by status
      if (task.status) {
        tasksByStatus[task.status] = (tasksByStatus[task.status] || 0) + 1;
      }

      // Count overdue (not completed and past due date)
      if (
        task.status !== "completed" &&
        task.due_date &&
        new Date(task.due_date) < today
      ) {
        overdueCount++;
      }

      // Count by assignee
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

    // Convert tasksByAssignee to array and sort by count descending
    const tasksByAssigneeArray = Object.values(tasksByAssignee).sort(
      (a, b) => b.count - a.count
    );

    // Fetch visits for timeline (next 12 weeks)
    let visitsQuery = supabase
      .from("visits")
      .select("id, scheduled_date, patient_id")
      .is("deleted_at", null)
      .gte("scheduled_date", new Date().toISOString().split("T")[0])
      .order("scheduled_date", { ascending: true });

    if (trialIds.length > 0) {
      // Join with patients to filter by trial
      const { data: visitsData } = await supabase
        .from("visits")
        .select("id, scheduled_date, patients!inner(trial_id)")
        .is("deleted_at", null)
        .gte("scheduled_date", new Date().toISOString().split("T")[0])
        .in("patients.trial_id", trialIds);
      visitsQuery = visitsData as any;
    } else {
      const { data: visitsData } = await visitsQuery;
      visitsQuery = visitsData as any;
    }

    // Build timeline data (group by week)
    const timelineMap: Record<
      string,
      { week: string; visits: number; tasks: number }
    > = {};

    // Helper to get week start date (Monday)
    const getWeekStart = (date: Date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      d.setDate(diff);
      return d;
    };

    // Helper to format week label
    const formatWeekLabel = (date: Date) => {
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const day = date.getDate();
      return `${month} ${day}`;
    };

    // Initialize next 12 weeks
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const weekStart = getWeekStart(
        new Date(currentDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
      );
      const weekKey = weekStart.toISOString().split("T")[0];
      timelineMap[weekKey] = {
        week: formatWeekLabel(weekStart),
        visits: 0,
        tasks: 0,
      };
    }

    // Count visits by week
    if (Array.isArray(visitsQuery)) {
      visitsQuery.forEach((visit: any) => {
        if (visit.scheduled_date) {
          const visitDate = new Date(visit.scheduled_date);
          const weekStart = getWeekStart(visitDate);
          const weekKey = weekStart.toISOString().split("T")[0];
          if (timelineMap[weekKey]) {
            timelineMap[weekKey].visits++;
          }
        }
      });
    }

    // Count tasks by week (using due_date)
    (tasks || []).forEach((task: any) => {
      if (
        task.due_date &&
        task.status !== "completed" &&
        new Date(task.due_date) >= today
      ) {
        const taskDate = new Date(task.due_date);
        const weekStart = getWeekStart(taskDate);
        const weekKey = weekStart.toISOString().split("T")[0];
        if (timelineMap[weekKey]) {
          timelineMap[weekKey].tasks++;
        }
      }
    });

    // Convert to array and sort by date
    const timeline = Object.keys(timelineMap)
      .sort()
      .map((key) => timelineMap[key]);

    // Build response
    const stats: DashboardStats = {
      trials: {
        total: trials?.length || 0,
        byStatus: trialsByStatus as Record<TrialStatus, number>,
      },
      patients: {
        total: patients?.length || 0,
        byStatus: patientsByStatus as Record<PatientStatus, number>,
      },
      tasks: {
        total: tasks?.length || 0,
        byStatus: tasksByStatus as Record<TaskStatus, number>,
        overdue: overdueCount,
        byAssignee: tasksByAssigneeArray,
      },
      teamMembers: {
        total: teamMemberCount || 0,
      },
      timeline,
    };

    return Response.json(stats);
  } catch (error) {
    console.error("[API] Unexpected error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
