/**
 * Chat Service (FastAPI BE)
 * Client-side service for managing Document AI chat sessions and messages
 */

import type {
    ChatSession,
    ChatMessage,
    ChatSessionWithMessages,
    CreateChatSessionInput,
    CreateChatMessageInput,
    UpdateChatSessionInput,
} from "@/types/chat";

/**
 * Helper to handle HTTP requests
 */
async function request<T>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(url, {
        ...options,
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Request failed");
    }

    return res.json();
}

/**
 * Get all chat sessions for a trial
 */
export async function getChatSessions(
    trialId: string
): Promise<ChatSession[]> {
    return request<ChatSession[]>(`/api/chat-sessions/?trial_id=${trialId}`);
}

/**
 * Get a single chat session with all its messages
 */
export async function getChatSession(
    sessionId: string
): Promise<ChatSessionWithMessages> {
    // Messages are fetched via BE messages GET endpoint
    const session = await request<ChatSession>(`/api/chat-sessions/${sessionId}`);
    const messages = await request<ChatMessage[]>(`/api/chat-messages/?session_id=${sessionId}`);
    return { ...session, messages };
}

/**
 * Create new chat session
 */
export async function createChatSession(
    input: CreateChatSessionInput
): Promise<ChatSession> {
    return request<ChatSession>(`/api/chat-sessions/`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

/**
 * Update chat session (e.g., change title)
 */
export async function updateChatSession(
    input: UpdateChatSessionInput
): Promise<ChatSession> {
    return request<ChatSession>(`/api/chat-sessions/${input.id}`, {
        method: "PUT",
        body: JSON.stringify(input),
    });
}

/**
 * Delete chat session (soft delete)
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
    await request<void>(`/api/chat-sessions/${sessionId}`, {
        method: "DELETE",
    });
}

/**
 * Create chat message
 */
export async function createChatMessage(
    input: CreateChatMessageInput
): Promise<ChatMessage> {
    return request<ChatMessage>(`/api/chat-messages/`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

/**
 * Update chat message
 */
export async function updateChatMessage(
    messageId: string,
    content: string
): Promise<ChatMessage> {
    return request<ChatMessage>(`/api/chat-messages/${messageId}`, {
        method: "PUT",
        body: JSON.stringify({ content }),
    });
}

/**
 * Delete chat message
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
    await request<void>(`/api/chat-messages/${messageId}`, {
        method: "DELETE",
    });
}