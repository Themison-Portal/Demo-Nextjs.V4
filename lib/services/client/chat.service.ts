/**
 * Chat Service
 * Client-side service for managing Document AI chat sessions and messages
 */

import { createClient } from "@/lib/supabase/client";
import type {
  ChatSession,
  ChatMessage,
  ChatSessionWithMessages,
  CreateChatSessionInput,
  CreateChatMessageInput,
  UpdateChatSessionInput,
} from "@/types/chat";

/**
 * Get all chat sessions for a trial and document
 */
export async function getChatSessions(
  trialId: string,
  documentId: string,
): Promise<ChatSession[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("trial_id", trialId)
    .eq("document_id", documentId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single chat session with all its messages
 */
export async function getChatSession(
  sessionId: string,
): Promise<ChatSessionWithMessages> {
  const supabase = createClient();

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("id", sessionId)
    .is("deleted_at", null)
    .single();

  if (sessionError) throw sessionError;
  if (!session) throw new Error("Chat session not found");

  // Get messages
  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("chat_session_id", sessionId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (messagesError) throw messagesError;

  return {
    ...session,
    messages: messages || [],
  };
}

/**
 * Create new chat session
 */
export async function createChatSession(
  input: CreateChatSessionInput,
): Promise<ChatSession> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: user.id,
      org_id: input.org_id,
      trial_id: input.trial_id,
      document_id: input.document_id,
      document_name: input.document_name,
      title: input.title,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating chat session:", error);
    throw error;
  }
  return data;
}

/**
 * Create chat message
 */
export async function createChatMessage(
  input: CreateChatMessageInput,
): Promise<ChatMessage> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      chat_session_id: input.chat_session_id,
      role: input.role,
      content: input.content,
      raw_data: input.raw_data || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase error creating chat message:", error);
    throw error;
  }
  return data;
}

/**
 * Update chat session (e.g., change title)
 */
export async function updateChatSession(
  input: UpdateChatSessionInput,
): Promise<ChatSession> {
  const supabase = createClient();

  const updateData: Record<string, any> = {};
  if (input.title !== undefined) updateData.title = input.title;

  const { data, error } = await supabase
    .from("chat_sessions")
    .update(updateData)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    console.error("Supabase error updating chat session:", error);
    throw error;
  }
  return data;
}

/**
 * Delete chat session (soft delete)
 */
export async function deleteChatSession(sessionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("chat_sessions")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) throw error;
}

/**
 * Delete chat message (soft delete)
 */
export async function deleteChatMessage(messageId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("chat_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", messageId);

  if (error) throw error;
}
