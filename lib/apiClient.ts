import { getAuth0Client } from "@/lib/auth0";

const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL!;

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const auth0 = await getAuth0Client();
    if (!auth0) throw new Error("Failed to initialize Auth0 client");

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
        const text = await response.text();
        throw new Error(`API error: ${response.status} - ${text}`);
    }

    return response.json();
}

export const apiClient = {
    // -----------------------
    // Organization
    // -----------------------
    getOrganization: async (orgId: string) =>
        fetchApi<any>(`/organization/${orgId}`),
    updateOrganization: async (orgId: string, payload: { name?: string; settings?: any }) =>
        fetchApi<any>(`/organization/${orgId}`, { method: "PATCH", body: JSON.stringify(payload) }),

    // -----------------------
    // Invitations
    // -----------------------
    getInvitations: async (status?: string) =>
        fetchApi<any[]>(`/invitations${status ? `?status=${status}` : ""}`),
    createInvitationsBatch: async (payload: { invitations: { email: string; name?: string; initial_role: string }[] }) =>
        fetchApi<any[]>("/invitations/batch", { method: "POST", body: JSON.stringify(payload) }),
    validateInvitationToken: async (token: string) =>
        fetchApi<any>(`/invitations/validate/${token}`),
    getInvitationCounts: async () =>
        fetchApi<{ pending: number; accepted: number; expired: number; total: number }>("/invitations/count"),

    // -----------------------
    // Members
    // -----------------------
    getCurrentUser: async () => fetchApi<any>("/me"),
    getMyTrialAssignments: async () => fetchApi<any[]>("/me/trial-assignments"),
    getMembers: async () => fetchApi<any[]>("/members"),
    updateMember: async (memberId: string, payload: any) =>
        fetchApi(`/members/${memberId}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteMember: async (memberId: string) =>
        fetchApi(`/members/${memberId}`, { method: "DELETE" }),

    // -----------------------
    // Trials
    // -----------------------
    getTrials: async () => fetchApi<any[]>(`/trials`),
    getTrialById: async (trialId: string) => fetchApi<any>(`/trials/${trialId}`),

    // -----------------------
    // Patients
    // -----------------------
    getPatients: async () => fetchApi<any[]>(`/patients`),
    getPatientById: async (patientId: string) => fetchApi<any>(`/patients/${patientId}`),

    // -----------------------
    // Visits
    // -----------------------
    getVisits: async (trialIds: string[] = [], patientIds: string[] = []) => {
        const params = [
            ...trialIds.map(id => `trial_id=${id}`),
            ...patientIds.map(id => `patient_id=${id}`)
        ].join("&");
        return fetchApi<any[]>(`/patient-visits${params ? "?" + params : ""}`);
    },

    // -----------------------
    // Tasks
    // -----------------------
    getTasks: async (trialIds: string[] = []) => {
        const params = trialIds.map(id => `trial_ids=${id}`).join("&");
        return fetchApi<any[]>(`/tasks${params ? "?" + params : ""}`);
    },
    createTask: async (payload: {
        trial_id: string;
        title: string;
        description?: string;
        status?: string;
        priority?: string;
        assigned_to?: string;
        due_date?: string;
        patient_id?: string;
        visit_id?: string;
        activity_type_id?: string;
    }) =>
        fetchApi<any>("/tasks", { method: "POST", body: JSON.stringify(payload) }),
    updateTask: async (taskId: string, payload: Partial<{
        title: string;
        description: string;
        status: string;
        priority: string;
        assigned_to: string;
        due_date: string;
        patient_id: string;
        visit_id: string;
        activity_type_id: string;
    }>) =>
        fetchApi<any>(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    deleteTask: async (taskId: string) =>
        fetchApi(`/tasks/${taskId}`, { method: "DELETE" }),

    // -----------------------
    // Team Members / Org Metrics
    // -----------------------
    getTeamMemberCount: async () => {
        const metrics = await fetchApi<{
            total_members: number;
            total_trials: number;
            total_patients: number;
            total_documents: number;
            active_trials: number;
        }>(`/organizations/me/metrics`);
        return metrics.total_members;
    },

    // -----------------------
    // Chat Messages
    // -----------------------
    getMessages: async (sessionId: string) =>
        fetchApi<any[]>(`/messages?session_id=${sessionId}`),
    createMessage: async (payload: { session_id: string; content: string }) =>
        fetchApi(`/messages`, { method: "POST", body: JSON.stringify(payload) }),
    updateMessage: async (messageId: string, content: string) =>
        fetchApi(`/messages/${messageId}`, { method: "PUT", body: JSON.stringify({ content }) }),
    deleteMessage: async (messageId: string) =>
        fetchApi(`/messages/${messageId}`, { method: "DELETE" }),

    // -----------------------
    // Chat Threads
    // -----------------------
    getThreads: async (trialId?: string) => {
        const params = trialId ? `?trial_id=${trialId}` : "";
        return fetchApi<any[]>(`/chat-threads${params}`);
    },
    createThread: async (payload: { title: string; trial_id?: string }) =>
        fetchApi(`/chat-threads`, { method: "POST", body: JSON.stringify(payload) }),
    updateThread: async (threadId: string, payload: { title?: string }) =>
        fetchApi(`/chat-threads/${threadId}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteThread: async (threadId: string) =>
        fetchApi(`/chat-threads/${threadId}`, { method: "DELETE" }),
    markThreadRead: async (threadId: string) =>
        fetchApi(`/chat-threads/${threadId}/read`, { method: "POST" }),

    // -----------------------
    // Trial Documents
    // -----------------------
    getTrialDocuments: async (trialId?: string) =>
        fetchApi<any[]>(`/documents${trialId ? `?trial_id=${trialId}` : ""}`),
    getTrialDocumentById: async (documentId: string) =>
        fetchApi<any>(`/documents/${documentId}`),
    uploadTrialDocument: async (
        file: File,
        trialId: string,
        documentName: string,
        documentType = "other",
        description = ""
    ) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("trial_id", trialId);
        formData.append("document_name", documentName);
        formData.append("document_type", documentType);
        formData.append("description", description);
        return fetchApi<any>("/documents/upload", {
            method: "POST",
            body: formData,
            headers: {},
        });
    },
    updateTrialDocument: async (documentId: string, payload: Record<string, any>) =>
        fetchApi<any>(`/documents/${documentId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    deleteTrialDocument: async (documentId: string) =>
        fetchApi(`/documents/${documentId}`, { method: "DELETE" }),
};