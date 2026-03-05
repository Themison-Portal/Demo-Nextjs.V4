export interface Organization {
    id: string;
    name: string;
    settings?: Record<string, any>;
    members?: any[];
    invitations?: any[];
}


export async function updateOrganization(
    orgId: string,
    payload: { name?: string; settings?: Record<string, any> }
): Promise<Organization | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/${orgId}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}