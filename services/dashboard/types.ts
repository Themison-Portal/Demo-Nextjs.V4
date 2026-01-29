export type TrialStatus = "active" | "paused" | "completed" | "terminated";
export type PatientStatus =
  | "screening"
  | "enrolled"
  | "completed"
  | "withdrawn"
  | "screen_failed";
export type TaskStatus = "todo" | "in_progress" | "completed" | "blocked";

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
    week: string; // Format: "Jan 20", "Jan 27", etc.
    visits: number;
    tasks: number;
  }>;
}
