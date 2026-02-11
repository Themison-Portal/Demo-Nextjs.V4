/**
 * Chat Interface - AI Assistant
 * Q&A interface for document queries
 */

"use client";

import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useTrialDocuments } from "@/hooks/client/useTrialDocuments";
import { useTasks } from "@/hooks/client/useTasks";
import { useDocumentQuery } from "@/hooks/client/useDocumentQuery";
import {
  useChatSession,
  useCreateChatSession,
  useCreateChatMessage,
} from "@/hooks/client/useChats";
import { Button } from "@/components/ui/button";
import { CreateTaskModal } from "@/components/app/tasks/CreateTaskModal";
import { SaveResponseModal } from "./SaveResponseModal";
import { SendResponseModal } from "@/components/app/messages/SendResponseModal";
import {
  FileText,
  ArrowUp,
  Sparkles,
  RotateCw,
  Bookmark,
  Send,
  Download,
  CheckSquare,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_CATEGORY_OPTIONS,
  DOCUMENT_CATEGORY_STYLES,
} from "@/lib/constants/documents";
import { isDevelopment } from "@/lib/constants";
import type { RagSource } from "@/services/rag/types";
import { MessageContent } from "./MessageContent";

// Dynamic import to avoid SSR issues with react-pdf
const PdfViewer = dynamic(
  () => import("./PdfViewer").then((mod) => ({ default: mod.PdfViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">Loading PDF viewer...</p>
      </div>
    ),
  },
);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  question?: string; // Store the original question for saving
  sources?: RagSource[]; // Sources from RAG backend
  rawData?: {
    question: Record<string, any>;
    answer: Record<string, any>;
  };
  timestamp: Date;
}

interface ChatInterfaceProps {
  orgId: string;
  trialId: string;
  documentId: string;
  chatId?: string; // Optional: Load existing chat
  onChangeDocument: () => void;
  onChatCreated?: (chatId: string) => void; // Optional: Callback when new chat is created
}

export function ChatInterface({
  orgId,
  trialId,
  documentId,
  chatId,
  onChangeDocument,
  onChatCreated,
}: ChatInterfaceProps) {
  const { documents } = useTrialDocuments(orgId, trialId);
  const { createTask, isCreating } = useTasks(orgId);
  const { queryDocument: queryDoc } = useDocumentQuery();
  const { data: chatSession } = useChatSession(chatId || null);
  const { mutateAsync: createChatSession } = useCreateChatSession();
  const { mutateAsync: createChatMessage } = useCreateChatMessage();
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    chatId || null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSourcesPanelOpen, setIsSourcesPanelOpen] = useState(false);
  const [selectedMessageContent, setSelectedMessageContent] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
  const [selectedSources, setSelectedSources] = useState<RagSource[]>([]);
  const [selectedSourceIndex, setSelectedSourceIndex] = useState<number>();
  const [selectedRawData, setSelectedRawData] = useState<
    | {
        question: Record<string, any>;
        answer: Record<string, any>;
      }
    | undefined
  >();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const document = documents.find((d) => d.id === documentId);
  const isDocumentReady = document?.status === "ready";
  const categoryLabel = document?.category
    ? DOCUMENT_CATEGORY_OPTIONS.find((c) => c.value === document.category)
        ?.label
    : null;
  const categoryStyle = document?.category
    ? DOCUMENT_CATEGORY_STYLES[document.category]
    : null;

  // Load existing chat messages
  useEffect(() => {
    if (chatSession?.messages) {
      const loadedMessages: Message[] = chatSession.messages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        question:
          msg.role === "assistant" ? msg.raw_data?.question?.text : undefined,
        sources: msg.raw_data?.sources,
        rawData: msg.raw_data
          ? {
              question: msg.raw_data.question || {},
              answer: msg.raw_data.answer || {},
            }
          : undefined,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(loadedMessages);
    } else if (!chatId) {
      // Clear messages and close PDF viewer when starting new chat (no chatId)
      setMessages([]);
      setCurrentChatId(null);
      setIsSourcesPanelOpen(false);
    }
  }, [chatSession, chatId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  // useEffect(() => {
  //   if (textareaRef.current) {
  //     textareaRef.current.style.height = "auto";
  //     textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
  //   }
  // }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const questionText = input.trim();
    const isFirstMessage = messages.length === 0;

    // Create temp user message for UI
    const tempUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: questionText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create chat session if this is the first message
      let chatSessionId = currentChatId;
      if (isFirstMessage && !chatSessionId) {
        const title = questionText.length > 50
          ? `${questionText.substring(0, 47)}...`
          : questionText;

        const newSession = await createChatSession({
          org_id: orgId,
          trial_id: trialId,
          document_id: documentId,
          document_name: document?.file_name || "Unknown",
          title,
        });

        chatSessionId = newSession.id;
        setCurrentChatId(chatSessionId);
        onChatCreated?.(chatSessionId);
      }

      // Save user message to DB
      if (chatSessionId) {
        const savedUserMsg = await createChatMessage({
          chat_session_id: chatSessionId,
          role: "user",
          content: questionText,
        });

        // Update temp message with real ID
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempUserMessage.id ? { ...m, id: savedUserMsg.id } : m,
          ),
        );
      }

      // Query RAG backend
      const result = await queryDoc({
        query: questionText,
        documentId,
        documentName: document?.file_name || "Unknown",
      });

      // Create temp assistant message for UI
      const tempAssistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: result.response,
        question: questionText,
        sources: result.sources,
        rawData: {
          question: {
            text: questionText,
            timestamp: new Date().toISOString(),
          },
          answer: {
            text: result.response,
            sources: result.sources,
          },
        },
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, tempAssistantMessage]);

      // Save assistant message to DB
      if (chatSessionId) {
        const savedAssistantMsg = await createChatMessage({
          chat_session_id: chatSessionId,
          role: "assistant",
          content: result.response,
          raw_data: {
            sources: result.sources,
            question: {
              text: questionText,
              timestamp: new Date().toISOString(),
            },
            answer: {
              text: result.response,
              sources: result.sources,
            },
          },
        });

        // Update temp message with real ID
        setMessages((prev) =>
          prev.map((m) =>
            m.id === tempAssistantMessage.id
              ? { ...m, id: savedAssistantMsg.id }
              : m,
          ),
        );
      }
    } catch (error) {
      console.error("Error querying document:", error);

      // Show error message
      const errorMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error while processing your question: ${error instanceof Error ? error.message : "Unknown error"}`,
        question: questionText,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // In development, use hardcoded PDF URL
  const pdfUrl = isDevelopment
    ? "https://npfouzkvpnyjusdozymu.supabase.co/storage/v1/object/public/trial-documents/trials/28b7ab97-e64f-43af-8610-9746d3f5a797/1769615995863_Protocol_Ulcerative-Colitis.pdf"
    : document?.storage_url || "";

  return (
    <div
      className={`relative h-[calc(100vh-20vh)] ${isSourcesPanelOpen ? "p-0" : "px-40"} flex gap-6`}
    >
      {/* Main Chat Area */}
      <div
        className={cn(
          "transition-all duration-300 flex flex-col h-full",
          isSourcesPanelOpen ? "w-[55%]" : "w-full",
        )}
      >
        {/* Document Info Header */}
        <div className="px-6 py-4 b border-gray-200 bg-white rounded-t-xl border-x border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-gray-800" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {document?.file_name || "Document"}
                  </p>
                  {categoryLabel && categoryStyle && (
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs font-semilight rounded-full",
                        categoryStyle,
                      )}
                    >
                      {categoryLabel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Ask questions about this document
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onChangeDocument}>
              <RotateCw className="w-4 h-4 mr-2" />
              Change Document
            </Button>
          </div>
        </div>

        {/* Messages Area - Scrollable */}
        <div
          className="overflow-y-auto bg-white border border-gray-200 rounded-b-2xl px-6 py-6 "
          style={{ height: "calc(100% - 100px)" }}
        >
          {messages.length === 0 ? (
            // Welcome message or processing state
            <div className="flex items-center justify-center h-full">
              {!isDocumentReady ? (
                <div className="text-center max-w-lg space-y-4">
                  <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
                    <RotateCw className="w-8 h-8 text-amber-600 animate-spin" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Analyzing Document...
                    </h3>
                    <p className="text-sm text-gray-600">
                      This document is being analyzed by AI. You&apos;ll be able
                      to ask questions once processing is complete.
                    </p>
                  </div>
                </div>
              ) : (
              <div className="text-center max-w-lg space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-blue-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Ready to Answer Your Questions
                  </h3>
                  <p className="text-sm text-gray-600">
                    Ask anything about this document. Get instant answers about
                    eligibility criteria, medical tests, visit schedules, and
                    more.
                  </p>
                </div>
                {/* Example queries */}
                <div className="pt-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Try asking
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {[
                      "What are the inclusion criteria for male patients 50-65?",
                      "What medical tests are required?",
                      "Generate a worksheet for the schedule of activities",
                    ].map((query) => (
                      <button
                        key={query}
                        onClick={() => setInput(query)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full transition-colors"
                      >
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              )}
            </div>
          ) : (
            // Messages
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-6 my-4",
                    message.role === "user"
                      ? "justify-end items-center"
                      : "justify-start items-start mb-8",
                  )}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%]",
                      message.role === "user" &&
                        "px-3 py-2 bg-gray-100 text-black rounded-lg",
                    )}
                  >
                    {message.role === "assistant" && message.sources ? (
                      <MessageContent
                        content={message.content}
                        sources={message.sources}
                        onCitationClick={(_source, index) => {
                          setSelectedSources(message.sources || []);
                          setSelectedSourceIndex(index);
                          setIsSourcesPanelOpen(true);
                        }}
                      />
                    ) : (
                      <p
                        className={cn(
                          "text-sm whitespace-pre-wrap leading-relaxed",
                          message.role === "assistant" &&
                            "text-gray-900 text-md",
                        )}
                      >
                        {message.content}
                      </p>
                    )}

                    {/* Quick Actions - Only for assistant messages */}
                    {message.role === "assistant" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => {
                            setSelectedMessageContent(message.content);
                            setSelectedQuestion(message.question || "");
                            setSelectedRawData(message.rawData);
                            setIsSaveModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMessageContent(message.content);
                            setSelectedQuestion(message.question || "");
                            setSelectedRawData(message.rawData);
                            setIsSendModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" />
                          Send
                        </button>
                        <button
                          onClick={() => {
                            /* TODO: Export response */
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMessageContent(message.content);
                            setIsTaskModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                          Create task
                        </button>
                        {/* Sources Button - Only if message has sources */}
                        {message.sources && message.sources.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedSources(message.sources || []);
                              setSelectedSourceIndex(0); // Start with first source
                              setIsSourcesPanelOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <List className="w-3.5 h-3.5" />
                            Sources ({message.sources.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1 items-center py-3">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area - Sticky at bottom with shadow */}
        <div className="relative left-0 right-0 top-4 h-auto w-full ">
          <form onSubmit={handleSubmit} className="h-auto w-full   ">
            <div className="w-full h-full relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  isDocumentReady
                    ? "Ask about eligibility criteria, medical tests, visit checklists..."
                    : "Document is being analyzed... Please wait."
                }
                disabled={isLoading || !isDocumentReady}
                rows={3}
                className="w-full  h-full p-4 resize-none rounded-2xl border border-gray-300 bg-white  pr-12 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading || !isDocumentReady}
                className="absolute right-4 bottom-9 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <ArrowUp className="w-4 h-4 text-white" />
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* PDF/Sources Panel - Right Side */}
      {isSourcesPanelOpen && (
        <div className="w-[45%] h-full transition-all duration-300">
          <PdfViewer
            url={pdfUrl}
            source={
              selectedSourceIndex !== undefined
                ? selectedSources[selectedSourceIndex]
                : undefined
            }
            onClose={() => {
              setIsSourcesPanelOpen(false);
              setSelectedSourceIndex(undefined);
            }}
          />
        </div>
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedMessageContent("");
        }}
        onSubmit={async (input) => {
          await createTask(input);
          setIsTaskModalOpen(false);
          setSelectedMessageContent("");
        }}
        isLoading={isCreating}
        orgId={orgId}
        initialDescription={selectedMessageContent}
        initialTrialId={trialId}
      />

      {/* Save Response Modal */}
      <SaveResponseModal
        orgId={orgId}
        trialId={trialId}
        documentId={documentId}
        question={selectedQuestion}
        answer={selectedMessageContent}
        rawData={selectedRawData}
        isOpen={isSaveModalOpen}
        onClose={() => {
          setIsSaveModalOpen(false);
          setSelectedMessageContent("");
          setSelectedQuestion("");
          setSelectedRawData(undefined);
        }}
        onSuccess={() => {
          // Optional: Show success message
          console.log("Response saved successfully!");
        }}
      />

      {/* Send Response Modal */}
      {selectedRawData && (
        <SendResponseModal
          orgId={orgId}
          trialId={trialId}
          responseSnapshot={selectedRawData as any}
          isOpen={isSendModalOpen}
          onClose={() => {
            setIsSendModalOpen(false);
            setSelectedMessageContent("");
            setSelectedQuestion("");
            setSelectedRawData(undefined);
          }}
          onSuccess={() => {
            setIsSendModalOpen(false);
            setSelectedMessageContent("");
            setSelectedQuestion("");
            setSelectedRawData(undefined);
          }}
        />
      )}
    </div>
  );
}
