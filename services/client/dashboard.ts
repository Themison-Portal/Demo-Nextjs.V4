/**
 * Dashboard Service
 * Fetches aggregated statistics for organization dashboard
 */

import type { DashboardStats } from "@/services/dashboard/types";

/**
 * Fetch dashboard statistics for an organization
 */
export async function getDashboardStats(
  orgId: string
): Promise<DashboardStats> {
  const response = await fetch(`/api/client/${orgId}/dashboard/stats`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch dashboard stats");
  }

  return response.json();
}
