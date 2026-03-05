// /**
//  * Shared helper to validate if users have trial access
//  * Used by both /validate-access endpoint and thread creation
//  *
//  * Access logic:
//  * - Org admin (superadmin/admin): Always has access to all trials
//  * - Trial team member: Has access to specific trial
//  */

// import type { SupabaseClient } from '@supabase/supabase-js'
// import { isAdminRole } from '@/lib/permissions/constants'

// interface ValidationResult {
//   valid_users: string[]
//   invalid_users: Array<{
//     id: string
//     email: string
//     full_name: string | null
//   }>
// }

// /**
//  * Validate if a list of users have access to a trial
//  *
//  * @param supabase - Supabase client
//  * @param orgId - Organization ID
//  * @param trialId - Trial ID
//  * @param userIds - Array of user IDs to validate
//  * @returns Object with valid_users and invalid_users arrays
//  */
// export async function validateTrialAccess(
//   supabase: SupabaseClient,
//   orgId: string,
//   trialId: string,
//   userIds: string[]
// ): Promise<ValidationResult> {
//   if (userIds.length === 0) {
//     return { valid_users: [], invalid_users: [] }
//   }

//   // Get all users details
//   const { data: users, error: usersError } = await supabase
//     .from('users')
//     .select('id, email, full_name')
//     .in('id', userIds)

//   if (usersError) {
//     throw new Error('Failed to fetch users')
//   }

//   if (!users || users.length === 0) {
//     return { valid_users: [], invalid_users: [] }
//   }

//   // Get organization members for these users
//   const { data: orgMembers, error: orgMembersError } = await supabase
//     .from('organization_members')
//     .select('id, user_id, org_role')
//     .eq('org_id', orgId)
//     .in('user_id', userIds)
//     .is('deleted_at', null)

//   if (orgMembersError) {
//     throw new Error('Failed to fetch organization members')
//   }

//   // Get trial team members
//   const { data: trialMembers, error: trialMembersError } = await supabase
//     .from('trial_team_members')
//     .select('org_member_id')
//     .eq('trial_id', trialId)

//   if (trialMembersError) {
//     throw new Error('Failed to fetch trial members')
//   }

//   const trialMemberIds = new Set(
//     trialMembers?.map((m) => m.org_member_id) || []
//   )

//   // Check access for each user
//   const validUsers: string[] = []
//   const invalidUsers: Array<{
//     id: string
//     email: string
//     full_name: string | null
//   }> = []

//   for (const requestedUser of users) {
//     const orgMember = orgMembers?.find((m) => m.user_id === requestedUser.id)

//     if (!orgMember) {
//       // User is not in organization
//       invalidUsers.push(requestedUser)
//       continue
//     }

//     // Check if user has access:
//     // 1. Admin role (superadmin/admin) -> access to all trials
//     // 2. Trial team member
//     const hasAdminAccess = isAdminRole(orgMember.org_role as any)
//     const hasTrialAccess = trialMemberIds.has(orgMember.id)

//     if (hasAdminAccess || hasTrialAccess) {
//       validUsers.push(requestedUser.id)
//     } else {
//       invalidUsers.push(requestedUser)
//     }
//   }

//   return {
//     valid_users: validUsers,
//     invalid_users: invalidUsers,
//   }
// }

/**
 * Validate if a list of users have access to a trial
 * Uses FastAPI backend for centralized access logic
 */

export interface ValidationResult {
    valid_users: string[]
    invalid_users: Array<{
        id: string
        email?: string
        full_name?: string | null
    }>
}

/**
 * Validate access for multiple users against a trial
 *
 * @param trialId - Trial ID to check
 * @param userIds - Array of user IDs to validate
 * @returns ValidationResult from BE: valid_user_ids and invalid_user_ids
 */
export async function validateTrialAccess(
    trialId: string,
    userIds: string[]
): Promise<ValidationResult> {
    if (!userIds || userIds.length === 0) {
        return { valid_users: [], invalid_users: [] }
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/trials/${trialId}/validate-access`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token") || ""}`, // if using JWT
                },
                body: JSON.stringify({ user_ids: userIds }),
                cache: "no-store",
            }
        )

        if (!response.ok) {
            const errorData = await response.json().catch(() => null)
            throw new Error(errorData?.detail || "Failed to validate trial access")
        }

        const data = await response.json()

        // Map BE response to ValidationResult structure
        return {
            valid_users: data.valid_user_ids || [],
            invalid_users: (data.invalid_user_ids || []).map((id: string) => ({
                id,
            })),
        }
    } catch (err: any) {
        console.error("Trial access validation failed:", err)
        return { valid_users: [], invalid_users: [] }
    }
}