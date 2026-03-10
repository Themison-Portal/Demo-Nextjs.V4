/**
 * Chat Hook
 * TanStack Query wrapper for Document AI chat sessions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

import type {
    CreateChatSessionInput,
    CreateChatMessageInput,
    UpdateChatSessionInput,
} from "@/types/chat";

/**
 * Get chat sessions for a trial
 */
export function useChats(trialId: string) {
    return useQuery({
        queryKey: ["chat-sessions", trialId],
        queryFn: () => apiClient.getChatSessions(trialId),
        enabled: !!trialId,
    });
}

/**
 * Get a single chat session with messages
 */
export function useChatSession(sessionId: string | null) {
    return useQuery({
        queryKey: ["chat-session", sessionId],
        queryFn: () => apiClient.getChatSession(sessionId!),
        enabled: !!sessionId,
    });
}

/**
 * Create chat session mutation
 */
export function useCreateChatSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateChatSessionInput) =>
            apiClient.createChatSession(input),

        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["chat-sessions", data.trial_id],
            });
        },
    });
}

/**
 * Create chat message mutation
 */
export function useCreateChatMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateChatMessageInput) =>
            apiClient.createChatMessage(input),

        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["chat-session", data.session_id],
            });

            queryClient.invalidateQueries({
                queryKey: ["chat-sessions"],
            });
        },
    });
}

/**
 * Update chat session mutation
 */
export function useUpdateChatSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateChatSessionInput) =>
            apiClient.updateChatSession(input),

        onSuccess: (data) => {
            queryClient.invalidateQueries({
                queryKey: ["chat-session", data.id],
            });

            queryClient.invalidateQueries({
                queryKey: ["chat-sessions", data.trial_id],
            });
        },
    });
}

/**
 * Delete chat session mutation
 */
export function useDeleteChatSession() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (sessionId: string) =>
            apiClient.deleteChatSession(sessionId),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
            queryClient.invalidateQueries({ queryKey: ["chat-session"] });
        },
    });
}