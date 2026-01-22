export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskSource = 'manual' | 'visit' | 'response';

export interface Task {
  id: string;
  trial_id: string;
  patient_id?: string | null;
  visit_id?: string | null;
  activity_type_id?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority?: TaskPriority | null; // Optional like Trello
  assigned_to?: string | null;
  due_date?: string | null;
  source?: TaskSource | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface TaskWithContext extends Task {
  patient?: {
    patient_number: string;
    initials?: string | null;
  } | null;
  visit?: {
    visit_name: string;
    scheduled_date?: string | null;
  } | null;
  activity_type?: {
    id: string;
    name: string;
    category?: string | null;
  } | null;
  trial?: {
    name: string;
  };
}

export interface MyTasksResponse {
  tasks: TaskWithContext[];
  total: number;
}
