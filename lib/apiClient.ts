import { getAuth0Client } from "@/lib/auth0";

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL!;

export async function apiClient<T>(
    endpoint: string,
    options?: RequestInit
): Promise<T> {
    const auth0 = await getAuth0Client();
    if (!auth0) {
        throw new Error("Failed to initialize Auth0 client");
    }
    const token = await auth0.getTokenSilently();

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options?.headers,
        },
    });

    if (!response.ok) {
        throw new Error("API error");
    }

    return response.json();
}