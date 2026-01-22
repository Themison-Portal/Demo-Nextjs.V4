import type { MyTasksResponse } from "@/services/tasks/types";

export async function getMyTasks(): Promise<MyTasksResponse> {
  const response = await fetch("/api/client/me/tasks", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch tasks");
  }

  return response.json();
}
