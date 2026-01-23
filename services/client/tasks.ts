import type {
  TasksResponse,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
} from "@/services/tasks/types";

/**
 * Get tasks for an organization with optional filters
 */
export async function getTasks(
  orgId: string,
  filters?: TaskFilters
): Promise<TasksResponse> {
  const params = new URLSearchParams();

  if (filters?.trial_id) params.append("trial_id", filters.trial_id);
  if (filters?.patient_id) params.append("patient_id", filters.patient_id);
  if (filters?.assigned_to) params.append("assigned_to", filters.assigned_to);
  if (filters?.status) params.append("status", filters.status);
  if (filters?.priority) params.append("priority", filters.priority);

  const queryString = params.toString();
  const url = `/api/client/${orgId}/tasks${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch tasks");
  }

  return response.json();
}

/**
 * Create a new task
 */
export async function createTask(
  orgId: string,
  input: CreateTaskInput
): Promise<any> {
  const response = await fetch(`/api/client/${orgId}/tasks`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create task");
  }

  return response.json();
}

/**
 * Update a task
 */
export async function updateTask(
  orgId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<any> {
  const response = await fetch(`/api/client/${orgId}/tasks/${taskId}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update task");
  }

  return response.json();
}

/**
 * Delete a task (soft delete)
 */
export async function deleteTask(
  orgId: string,
  taskId: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/client/${orgId}/tasks/${taskId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete task");
  }

  return response.json();
}
