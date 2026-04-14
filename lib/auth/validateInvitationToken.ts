/**
 * Validate Invitation Token
 * Server-side validation via FastAPI backend
 */

export interface InvitationValidationResult {
    valid: true;
    invitation: {
        id: string;
        email: string;
        org_id: string;
        org_role: string;
        organization: {
            id: string;
            name: string;
        };
        name?: string;
        expires_at?: string;
    };
}

export interface InvitationValidationError {
    valid: false;
    error: "no_token" | "not_found" | "not_pending" | "expired" | "user_exists";
    details?: string;
}

export type InvitationValidation = InvitationValidationResult | InvitationValidationError;

export async function validateInvitationToken(
    token: string | null
): Promise<InvitationValidation> {
    if (!token) {
        return { valid: false, error: "no_token" };
    }

    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/invitations/validate/${token}`,
            {
                credentials: "include", // send cookies if needed
                cache: "no-store",
            }
        );

        if (!response.ok) {
            if (response.status === 404) {
                return { valid: false, error: "not_found" };
            } else if (response.status === 400) {
                const data = await response.json();
                // Expect backend to include details about status/expired/etc.
                return { valid: false, error: data.detail === "expired" ? "expired" : "not_pending", details: data.detail };
            }
            throw new Error("Unexpected response from server");
        }

        const invitation = await response.json();

        return {
            valid: true,
            invitation: {
                id: invitation.id,
                email: invitation.email,
                org_id: invitation.organization_id,
                org_role: invitation.initial_role,
                organization: {
                    id: invitation.organization.id,
                    name: invitation.organization.name,
                },
                name: invitation.name,
                expires_at: invitation.expires_at,
            },
        };
    } catch (err: any) {
        console.error("Failed to validate invitation token:", err);
        return { valid: false, error: "not_found" };
    }
}