/**
 * Chat Hook
 * TanStack Query wrapper for Document AI chat sessions
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChatSessions,
  getChatSession,
  createChatSession,
  createChatMessage,
  updateChatSession,
  deleteChatSession,
} from "@/lib/services/client/chat.service";
import type {
  CreateChatSessionInput,
  CreateChatMessageInput,
  UpdateChatSessionInput,
} from "@/types/chat";

/**
 * Get chat sessions for a trial and document
 */
export function useChats(trialId: string, documentId: string) {
  return useQuery({
    queryKey: ["chat-sessions", trialId, documentId],
    queryFn: () => getChatSessions(trialId, documentId),
    enabled: !!trialId && !!documentId,
  });
}

/**
 * Get a single chat session with messages
 */
export function useChatSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: () => getChatSession(sessionId!),
    enabled: !!sessionId,
  });
}

/**
 * Create chat session mutation
 */
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChatSessionInput) => createChatSession(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["chat-sessions", data.trial_id, data.document_id],
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
    mutationFn: (input: CreateChatMessageInput) => createChatMessage(input),
    onSuccess: (data) => {
      // Invalidate chat session to refresh messages
      queryClient.invalidateQueries({
        queryKey: ["chat-session", data.chat_session_id],
      });
      // Also invalidate chat sessions list to update "updated_at"
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
    mutationFn: (input: UpdateChatSessionInput) => updateChatSession(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["chat-session", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["chat-sessions", data.trial_id, data.document_id],
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
    mutationFn: (sessionId: string) => deleteChatSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["chat-session"] });
    },
  });
}
