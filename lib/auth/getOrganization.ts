export interface Organization {
    id: string;
    name: string;
    settings?: Record<string, any>;
    members?: any[];
    invitations?: any[];
}

export async function getOrganization(orgId: string): Promise<Organization | null> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/organization/${orgId}`, {
            credentials: "include",
            cache: "no-store",
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}