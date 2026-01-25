export interface TeamMemberTrialInfo {
  trial_id: string;
  trial_name: string;
  trial_role: string;
}

export interface TeamMember {
  user_id: string;
  email: string;
  full_name?: string | null;
  trial_role: string; // Primary role (from first trial)
  trial_id: string; // Primary trial
  trial_name: string;
  trials: TeamMemberTrialInfo[]; // All trials this user is in
}

export interface TeamMembersResponse {
  team_members: TeamMember[];
}

/**
 * Get team members from all trials the user has access to
 * @param orgId - Organization ID
 * @param trialId - Optional filter by specific trial
 */
export async function getTeamMembers(
  orgId: string,
  trialId?: string
): Promise<TeamMembersResponse> {
  const params = new URLSearchParams();
  if (trialId) params.append("trial_id", trialId);

  const queryString = params.toString();
  const url = `/api/client/${orgId}/team-members${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch team members");
  }

  return response.json();
}
