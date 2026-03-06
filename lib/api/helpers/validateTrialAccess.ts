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