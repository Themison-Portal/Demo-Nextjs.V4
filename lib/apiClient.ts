import type {
    Trial,
    TrialTeamMember,
    VisitScheduleTemplate,
} from "./../services/trials/types";
import type { ActivityType, TrialActivityType } from "@/services/activities/types";
import type { TrialDetails } from "@/services/trials/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...(isFormData ? {} : { "Content-Type": "application/json" }),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        let errorMessage = `API error: ${response.status}`;
        try {
            const errorJson = await response.json();
            errorMessage = errorJson?.detail || errorJson?.error || errorMessage;
        } catch {
            const text = await response.text();
            if (text) errorMessage = text;
        }
        throw new Error(errorMessage);
    }

    if (response.status === 204) return {} as T;

    return response.json();
}

export const apiClient = {
    // -----------------------
    // Organization
    // -----------------------
    getOrganization: async () => fetchApi("/organizations/me"),
    updateOrganization: async (payload: { name?: string; settings?: any }) =>
        fetchApi("/organizations/me", { method: "PUT", body: JSON.stringify(payload) }),
    getOrganizationMetrics: async () => fetchApi("/organizations/me/metrics"),

    // -----------------------
    // Invitations
    // -----------------------
    getInvitations: async (status?: string) =>
        fetchApi(`/invitations${status ? `?status=${status}` : ""}`),
    createInvitationsBatch: async (payload: { invitations: { email: string; name?: string; initial_role: string }[] }) =>
        fetchApi("/invitations/batch", { method: "POST", body: JSON.stringify(payload) }),
    validateInvitationToken: async (token: string) =>
        fetchApi(`/invitations/validate/${token}`),
    getInvitationCounts: async () => fetchApi("/invitations/count"),
    inviteMember: async (orgId: string, payload: { email: string; org_role: string }) =>
        fetchApi(`/organizations/members`, { method: "POST", body: JSON.stringify({ ...payload, org_id: orgId }) }),

    // -----------------------
    // Members
    // -----------------------
    getCurrentUser: async () => fetchApi("/me"),
    getMyTrialAssignments: async () => fetchApi("/me/trial-assignments"),
    getMembers: async () => fetchApi("/members"),
    getTrialTeamMembers: async (trialId: string) =>
        fetchApi<TrialTeamMember[]>(`/trials/${trialId}/team-members`),
    updateMember: async (memberId: string, payload: any) =>
        fetchApi(`/members/${memberId}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteMember: async (memberId: string) =>
        fetchApi(`/members/${memberId}`, { method: "DELETE" }),

    // -----------------------
    // Trials
    // -----------------------
    getTrials: async () => fetchApi(`/trials`),
    getTrialById: (trialId: string): Promise<TrialDetails> =>
        fetchApi<TrialDetails>(`/trials/${trialId}`),


    // -----------------------
    // Patients
    // -----------------------
    getPatients: async () => fetchApi(`/ patients`),
    getPatientById: async (patientId: string) => fetchApi(`/ patients / ${patientId}`),
    createPatient: async (payload: any) => fetchApi("/patients", { method: "POST", body: JSON.stringify(payload) }),
    updatePatient: async (patientId: string, payload: any) =>
        fetchApi(`/ patients / ${patientId} `, { method: "PATCH", body: JSON.stringify(payload) }),

    // -----------------------
    // Visits
    // -----------------------
    getPatientVisits: async (patientId: string) => fetchApi(`/ patients / ${patientId}/visits`),
    updateVisit: async (visitId: string, payload: any) =>
        fetchApi(`/visits/${visitId}`, { method: "PATCH", body: JSON.stringify(payload) }),

    // -----------------------
    // Tasks
    // -----------------------
    createTask: async (payload: {
        trial_id: string;
        patient_id: string;
        visit_id: string;
        visit_activity_id?: string;
        activity_type_id?: string;
        title: string;
        status?: string;
        priority?: string;
        assigned_to?: string; // change from string | null → string | undefined
        due_date?: string;
        source?: string;       // optional, hydration can include it
        source_id?: string;
    }) =>
        fetchApi("/tasks", { method: "POST", body: JSON.stringify(payload) }),

    updateTasksByVisit: async (
        visitId: string,
        payload: Partial<{ status: string; assigned_to?: string; due_date?: string }>
    ) => fetchApi(`/visits/${visitId}/tasks`, { method: "PATCH", body: JSON.stringify(payload) }),

    updateTask: async (taskId: string, payload: any) =>
        fetchApi(`/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(payload) }),

    // -----------------------
    // Chat Threads & Messages
    // -----------------------
    getThreads: async (trialId?: string) =>
        fetchApi(`/chat-threads${trialId ? `?trial_id=${trialId}` : ""}`),
    createThread: async (payload: { title: string; trial_id?: string }) =>
        fetchApi(`/chat-threads`, { method: "POST", body: JSON.stringify(payload) }),
    updateThread: async (threadId: string, payload: { title?: string }) =>
        fetchApi(`/chat-threads/${threadId}`, { method: "PUT", body: JSON.stringify(payload) }),
    deleteThread: async (threadId: string) =>
        fetchApi(`/chat-threads/${threadId}`, { method: "DELETE" }),
    markThreadRead: async (threadId: string) =>
        fetchApi(`/chat-threads/${threadId}/read`, { method: "POST" }),

    getMessages: async (sessionId: string) => fetchApi(`/messages?session_id=${sessionId}`),
    createMessage: async (payload: { session_id: string; content: string }) =>
        fetchApi("/messages", { method: "POST", body: JSON.stringify(payload) }),
    updateMessage: async (messageId: string, content: string) =>
        fetchApi(`/messages/${messageId}`, { method: "PUT", body: JSON.stringify({ content }) }),
    deleteMessage: async (messageId: string) =>
        fetchApi(`/messages/${messageId}`, { method: "DELETE" }),

    // -----------------------
    // Trial Documents
    // -----------------------
    getTrialDocuments: async (trialId?: string) =>
        fetchApi(`/documents${trialId ? `?trial_id=${trialId}` : ""}`),
    getTrialDocumentById: async (documentId: string) =>
        fetchApi(`/documents/${documentId}`),
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

        return fetchApi(`/documents/upload`, { method: "POST", body: formData });
    },
    updateTrialDocument: async (documentId: string, payload: Record<string, any>) =>
        fetchApi(`/documents/${documentId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    deleteTrialDocument: async (documentId: string) =>
        fetchApi(`/documents/${documentId}`, { method: "DELETE" }),


    // -----------------------
    // Activities / Activity Types
    // -----------------------
    getTrialActivity: async (
        trialId: string,
        activityId: string
    ): Promise<TrialActivityType | null> =>
        fetchApi(`/trials/${trialId}/activities/${activityId}`),

    getActivityType: async (activityId: string): Promise<ActivityType | null> =>
        fetchApi(`/activity-types/${activityId}`),


    // -----------------------
    // Visits & Visit Activities
    // -----------------------

    // Create a visit
    createVisit: async (payload: {
        patient_id: string;
        trial_id?: string;
        visit_template_name: string;
        visit_name: string;
        visit_order: number;
        days_from_day_zero?: number;
        is_day_zero?: boolean;
        scheduled_date: string;
        status?: string;
    }): Promise<{ id: string }> =>
        fetchApi(`/visits`, { method: "POST", body: JSON.stringify(payload) }),

    // Create a visit activity
    createVisitActivity: async (payload: {
        visit_id: string;
        activity_type_id: string;
        activity_name: string;
        activity_order: number;
        status?: string;
    }): Promise<{ id: string }> =>
        fetchApi(`/visit-activities`, { method: "POST", body: JSON.stringify(payload) }),
};