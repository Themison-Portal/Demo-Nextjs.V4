/**
 * Document AI Chat Types
 */

export interface ChatSession {
  id: string;
  user_id: string;
  org_id: string;
  trial_id: string;
  document_id: string;
  document_name: string;
  title: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ChatMessage {
  id: string;
  chat_session_id: string;
  role: "user" | "assistant";
  content: string;
  raw_data: {
    sources?: Array<{
      name: string;
      page: number;
      section: string;
      exactText: string;
      bboxes: number[][];
      relevance: "high" | "medium" | "low";
    }>;
    question?: Record<string, any>;
    answer?: Record<string, any>;
  } | null;
  created_at: string;
  deleted_at: string | null;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

export interface CreateChatSessionInput {
  org_id: string;
  trial_id: string;
  document_id: string;
  document_name: string;
  title: string;
}

export interface CreateChatMessageInput {
  chat_session_id: string;
  role: "user" | "assistant";
  content: string;
  raw_data?: {
    sources?: Array<{
      name: string;
      page: number;
      section: string;
      exactText: string;
      bboxes: number[][];
      relevance: "high" | "medium" | "low";
    }>;
    question?: Record<string, any>;
    answer?: Record<string, any>;
  };
}

export interface UpdateChatSessionInput {
  id: string;
  title?: string;
}
