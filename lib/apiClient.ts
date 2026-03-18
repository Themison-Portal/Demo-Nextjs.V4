import type {
    Trial,
    TrialTeamMember,
    VisitScheduleTemplate,
    TeamMembersResponse,
    UpdateTrialInput,
    TrialWithAssignmentsCreate

} from "./../services/trials/types";
import type {
    ArchiveFolder,
    SavedResponse,
    CreateFolderInput,
    CreateSavedResponseInput,
} from "@/types/archive";




import type {
    ChatSession,
    ChatMessage,
    ChatSessionWithMessages,
    CreateChatSessionInput,
    CreateChatMessageInput,
    UpdateChatSessionInput,
} from "@/types/chat";
import type { PatientVisit } from "@/services/visits/types";
import type { TaskWithContext, Task, TaskPayload } from "@/services/tasks/types";
import type { AddTrialTeamMemberInput, TrialRole } from "./../services/trials/types";
import type { TrialDocument } from "@/services/documents/types";

import type {
    ActivityType,
    ActivityListResponse,
    TrialActivityType,
    TrialActivityListResponse,
    CreateTrialActivityInput,
    UpdateTrialActivityInput,
    ActivityMetadata,
} from "@/services/activities/types";
import type { TrialDetails } from "@/services/trials/types";
import { Organization } from "@/services/organizations/types";
// import { getAuth0Client } from "@/lib/auth0";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) throw new Error("NEXT_PUBLIC_API_URL is not defined");

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        credentials: "include", // include cookies for session management if needed
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `API error: ${response.status}`);
    }

    return response.status === 204 ? ({} as T) : response.json();
}

export const apiClient = {
    // -----------------------
    // Organization
    // -----------------------
    getOrganization: async (id?: string): Promise<Organization> => {
        // If ID is provided, admin endpoint, else fallback to /me
        return fetchApi(id ? `/organizations/${id}` : "/organizations/me");
    },



    updateOrganization: async (
        payload: { name?: string; settings?: any },
        id?: string
    ): Promise<void> => {
        return fetchApi(id ? `/organizations/${id}` : "/organizations/me", {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },

    getOrganizationMetrics: async () => fetchApi("/organizations/me/metrics"),

    // Invite member to organization (admin)
    inviteMemberorg: async (orgId: string, payload: { email: string; org_role: string }): Promise<void> =>
        fetchApi(`/organizations/members`, {
            method: "POST",
            body: JSON.stringify({ ...payload, org_id: orgId }),
        }),

    removeMember: async (memberId: string): Promise<void> =>
        fetchApi(`/members/${memberId}`, { method: "DELETE" }),
    getTeamMembers: async (): Promise<TeamMembersResponse> => {
        return fetchApi("/members");
    },

    // -----------------------
    // Console / Admin org APIs
    // -----------------------

    /**
     * List all organizations (console)
     */
    getOrganizations: async () => {
        return fetchApi("/organizations");
    },

    /**
     * Create organization
     */
    createOrganization: async (payload: {
        name: string;
        settings?: any;
    }) => {
        return fetchApi("/organizations", {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Update organization (console PATCH)
     */
    patchOrganization: async (
        orgId: string,
        payload: { name?: string; settings?: any }
    ) => {
        return fetchApi(`/organizations/${orgId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
        });
    },

    /**
     * Invite member (uses invitation system)
     */
    inviteMemberToOrganization: async (
        payload: { email: string; org_role: string }
    ) =>
        fetchApi("/invitations/batch", {
            method: "POST",
            body: JSON.stringify({
                invitations: [
                    {
                        email: payload.email,
                        initial_role: payload.org_role,
                    },
                ],
            }),
        }),

    /**
     * Remove member from organization
     */
    removeMemberFromOrganization: async (orgId: string, memberId: string) =>
        fetchApi(`/organizations/${orgId}/members/${memberId}`, {
            method: "DELETE",
        }),

    // /**
    //  * Get team members
    //  */
    // getTeamMembers: async (): Promise<TeamMembersResponse> => {
    //     return fetchApi("/members");
    // },


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
    // getCurrentUser: async () => fetchApi("/me"),
    getCurrentUser: async (): Promise<{
        member: { id: string; email: string; default_role: string; onboarding_completed: boolean };
        profile?: { first_name?: string; last_name?: string };
        organization?: { id?: string; name?: string };
    }> => {
        return fetchApi("/auth/me");
    },
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
    getTrials: async (): Promise<TrialDetails[]> => fetchApi(`/trials`),
    getTrialById: (trialId: string): Promise<TrialDetails> =>
        fetchApi<TrialDetails>(`/trials/${trialId}`),
    createTrialWithAssignments: async (
        orgId: string,  // optional if BE derives org from current member
        payload: TrialWithAssignmentsCreate
    ): Promise<TrialDetails> => {
        return fetchApi(`/trials/with-assignments`, {
            method: "POST",
            body: JSON.stringify(payload),
        });
    },

    updateTrial: async (trialId: string, payload: UpdateTrialInput) => {
        return fetchApi(`/trials/${trialId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        });
    },


    // -----------------------
    // Patients
    // -----------------------
    getPatients: async () => fetchApi(`/patients`),
    getPatientById: async (patientId: string) => fetchApi(`/patients/${patientId}`),
    createPatient: async (payload: any) => fetchApi("/patients", { method: "POST", body: JSON.stringify(payload) }),
    updatePatient: async (patientId: string, payload: any) =>
        fetchApi(`/patients/${patientId}`, { method: "PATCH", body: JSON.stringify(payload) }),
    deletePatient: async (patientId: string): Promise<void> =>
        fetchApi(`/patients/${patientId}`, {
            method: "DELETE",
        }),


    // -----------------------
    // Visits
    // -----------------------
    getPatientVisits: async (patientId: string) => fetchApi(`/ patients/${patientId}/visits`),
    completeVisit: async (
        orgId: string,
        trialId: string,
        patientId: string,
        visitId: string
    ): Promise<PatientVisit> => {
        return fetchApi(
            `/api/client/${orgId}/trials/${trialId}/patients/${patientId}/visits/${visitId}/complete`,
            {
                method: "POST",
                credentials: "include",
            }
        );
    },

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
    }): Promise<TaskPayload> =>
        fetchApi("/tasks", { method: "POST", body: JSON.stringify(payload) }),

    updateTasksByVisit: async (
        visitId: string,
        payload: Partial<{ status: string; assigned_to?: string; due_date?: string }>
    ): Promise<number> => fetchApi(`/visits/${visitId}/tasks`, { method: "PATCH", body: JSON.stringify(payload) }),

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
    // Chat / Document AI 
    // -----------------------

    getChatSessions: async (trialId: string): Promise<ChatSession[]> =>
        fetchApi(`/api/chat-sessions/?trial_id=${trialId}`),

    getChatSession: async (sessionId: string): Promise<ChatSessionWithMessages> => {
        const session = await fetchApi<ChatSession>(`/api/chat-sessions/${sessionId}`);

        const messages = await fetchApi<ChatMessage[]>(
            `/api/chat-messages/?session_id=${sessionId}`
        );

        return { ...session, messages };
    },

    createChatSession: async (
        payload: CreateChatSessionInput
    ): Promise<ChatSession> =>
        fetchApi(`/api/chat-sessions/`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    updateChatSession: async (
        payload: UpdateChatSessionInput
    ): Promise<ChatSession> =>
        fetchApi(`/api/chat-sessions/${payload.id}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        }),

    deleteChatSession: async (sessionId: string): Promise<void> =>
        fetchApi(`/api/chat-sessions/${sessionId}`, {
            method: "DELETE",
        }),

    createChatMessage: async (
        payload: CreateChatMessageInput
    ): Promise<ChatMessage> =>
        fetchApi(`/api/chat-messages/`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    updateChatMessage: async (
        messageId: string,
        content: string
    ): Promise<ChatMessage> =>
        fetchApi(`/api/chat-messages/${messageId}`, {
            method: "PUT",
            body: JSON.stringify({ content }),
        }),

    deleteChatMessage: async (messageId: string): Promise<void> =>
        fetchApi(`/api/chat-messages/${messageId}`, {
            method: "DELETE",
        }),

    // -----------------------
    // Trial Documents
    // -----------------------
    getTrialDocuments: async (trialId: string): Promise<TrialDocument[]> =>
        fetchApi(`/documents?trial_id=${trialId}`),
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
    ): Promise<TrialActivityType | null> => {
        return fetchApi(`/api/trials/${trialId}/activities/${activityId}`);
    },

    getActivityType: async (activityId: string): Promise<ActivityType | null> => {
        return fetchApi(`/api/activity-types/${activityId}`);
    },

    getTrialActivityTypes: async (
        trialId: string
    ): Promise<TrialActivityListResponse> => {
        return fetchApi(`/api/trials/${trialId}/activities`);
    },

    createTrialActivity: async (
        trialId: string,
        data: CreateTrialActivityInput
    ): Promise<TrialActivityType> => {
        return fetchApi(`/api/trials/${trialId}/activities`, {
            method: "POST",
            body: JSON.stringify(data),
        });
    },

    updateTrialActivity: async (
        trialId: string,
        activityId: string,
        data: UpdateTrialActivityInput
    ): Promise<TrialActivityType> => {
        return fetchApi(`/api/trials/${trialId}/activities/${activityId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    },

    deleteTrialActivity: async (
        trialId: string,
        activityId: string
    ): Promise<void> => {
        return fetchApi(`/api/trials/${trialId}/activities/${activityId}`, {
            method: "DELETE",
        });
    },


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

    // -----------------------
    // Archive (Response Library)
    // -----------------------
    getArchiveFolders: async (orgId: string): Promise<ArchiveFolder[]> =>
        fetchApi(`/archive/folders/?org_id=${orgId}`),

    createArchiveFolder: async (payload: CreateFolderInput): Promise<ArchiveFolder> =>
        fetchApi(`/archive/folders/`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    deleteArchiveFolder: async (folderId: string): Promise<void> =>
        fetchApi(`/archive/folders/${folderId}`, {
            method: "DELETE",
        }),

    getSavedResponses: async (folderId: string): Promise<SavedResponse[]> =>
        fetchApi(`/archive/responses/?folder_id=${folderId}`),

    createSavedResponse: async (payload: CreateSavedResponseInput): Promise<SavedResponse> =>
        fetchApi(`/archive/responses/`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    updateSavedResponse: async (
        responseId: string,
        payload: Partial<SavedResponse>
    ): Promise<SavedResponse> =>
        fetchApi(`/archive/responses/${responseId}`, {
            method: "PUT",
            body: JSON.stringify(payload),
        }),

    deleteSavedResponse: async (responseId: string): Promise<void> =>
        fetchApi(`/archive/responses/${responseId}`, {
            method: "DELETE",
        }),

    // -----------------------
    // Visit Schedule Template
    // -----------------------

    getVisitTemplate: async (
        trialId: string
    ): Promise<VisitScheduleTemplate> =>
        fetchApi(`/trials/${trialId}/template`),

    updateVisitTemplate: async (
        trialId: string,
        template: VisitScheduleTemplate
    ): Promise<VisitScheduleTemplate> =>
        fetchApi(`/trials/${trialId}/template`, {
            method: "PUT",
            body: JSON.stringify(template),
        }),


    // -----------------------
    // Trial Team Members
    // -----------------------
    getTrialTeam: async (orgId: string, trialId: string): Promise<TrialTeamMember[]> =>
        apiClient.getTrialTeamMembers(trialId), // reuse existing endpoint

    addTrialTeamMember: async (
        orgId: string,           // new argument
        trialId: string,
        payload: AddTrialTeamMemberInput
    ): Promise<TrialTeamMember> =>
        fetchApi(`/orgs/${orgId}/trials/${trialId}/team-members`, {
            method: "POST",
            body: JSON.stringify(payload),
        }),

    updateTrialTeamMember: async (
        orgId: string,
        trialId: string,
        memberId: string,
        role: TrialRole
    ): Promise<TrialTeamMember> =>
        fetchApi(`/trials/${trialId}/team-members/${memberId}`, { method: "PATCH", body: JSON.stringify({ role }) }),

    updateTrialTeamMemberSettings: async (
        orgId: string,
        trialId: string,
        memberId: string,
        settings: Record<string, any>
    ): Promise<TrialTeamMember> =>
        fetchApi(`/trials/${trialId}/team-members/${memberId}/settings`, { method: "PATCH", body: JSON.stringify(settings) }),

    updateTrialTeamMemberStatus: async (
        orgId: string,
        trialId: string,
        memberId: string,
        status: "active" | "inactive"
    ): Promise<TrialTeamMember> =>
        fetchApi(`/trials/${trialId}/team-members/${memberId}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

    removeTrialTeamMember: async (
        orgId: string,
        trialId: string,
        memberId: string
    ): Promise<void> =>
        fetchApi(`/trials/${trialId}/team-members/${memberId}`, { method: "DELETE" }),

    // -----------------------
    // RAG PDF Upload / Processing
    // -----------------------

    /**
     * Upload PDF for RAG processing
     * Returns a job ID immediately
     */
    uploadPdfDocument: async (
        documentUrl: string,
        documentId: string,
        chunkSize = 750
    ): Promise<{ job_id: string; document_id: string; status: string; message: string }> =>
        fetchApi(`/upload-pdf`, {
            method: "POST",
            body: JSON.stringify({ document_url: documentUrl, document_id: documentId, chunk_size: chunkSize }),
        }),

    /**
     * Poll PDF ingestion status by job ID
     */
    getUploadStatus: async (
        jobId: string
    ): Promise<{
        job_id: string;
        document_id: string;
        status: "queued" | "processing" | "completed" | "failed";
        progress_percent: number;
        current_stage?: string;
        message?: string;
        result?: any;
        error?: string;
    }> =>
        fetchApi(`/status/${jobId}`),

    // -----------------------
    // Tasks
    // -----------------------
    getTasks: async (params?: {
        trial_id?: string;
        patient_id?: string;
        assigned_to?: string;
        status?: string;
        priority?: string;
        category?: string;
    }): Promise<TaskWithContext[]> => {

        const query = new URLSearchParams();

        if (params?.trial_id) query.append("trial_id", params.trial_id);
        if (params?.patient_id) query.append("patient_id", params.patient_id);
        if (params?.assigned_to) query.append("assigned_to", params.assigned_to);
        if (params?.status) query.append("status", params.status);
        if (params?.priority) query.append("priority", params.priority);
        if (params?.category) query.append("category", params.category);

        const qs = query.toString();

        return fetchApi(`/tasks${qs ? `?${qs}` : ""}`);
    },

    // createTask: async (payload: TaskCreate): Promise<Task> =>
    //     fetchApi("/tasks", {
    //         method: "POST",
    //         body: JSON.stringify(payload),
    //     }),

    // updateTask: async (taskId: string, payload: TaskUpdate): Promise<Task> =>
    //     fetchApi(`/tasks/${taskId}`, {
    //         method: "PATCH",
    //         body: JSON.stringify(payload),
    //     }),

    deleteTask: async (taskId: string): Promise<{ success: boolean }> =>
        fetchApi(`/tasks/${taskId}`, {
            method: "DELETE",
        }),

    ragQuery: async (payload: {
        query: string;
        document_id: string;
        document_name: string;
    }) => {
        const res = await fetch("/api/rag/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("RAG query failed");

        return res.json();
    },
};