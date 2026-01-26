/**
 * Chat Interface - AI Assistant
 * Q&A interface for document queries
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useTrialDocuments } from "@/hooks/client/useTrialDocuments";
import { useTasks } from "@/hooks/client/useTasks";
import { Button } from "@/components/ui/button";
import { CreateTaskModal } from "@/components/app/tasks/CreateTaskModal";
import { SaveResponseModal } from "./SaveResponseModal";
import {
  FileText,
  ArrowUp,
  Sparkles,
  RotateCw,
  Bookmark,
  Send,
  Download,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DOCUMENT_CATEGORY_OPTIONS,
  DOCUMENT_CATEGORY_STYLES,
} from "@/lib/constants/documents";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  question?: string; // Store the original question for saving
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
  onChangeDocument: () => void;
}

export function ChatInterface({
  orgId,
  trialId,
  documentId,
  onChangeDocument,
}: ChatInterfaceProps) {
  const { documents } = useTrialDocuments(orgId, trialId);
  const { createTask, isCreating } = useTasks(orgId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [selectedMessageContent, setSelectedMessageContent] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState("");
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
  const categoryLabel = document?.category
    ? DOCUMENT_CATEGORY_OPTIONS.find((c) => c.value === document.category)
        ?.label
    : null;
  const categoryStyle = document?.category
    ? DOCUMENT_CATEGORY_STYLES[document.category]
    : null;

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

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const questionText = input.trim(); // Store question for later

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // TODO: Replace with actual RAG backend call
    // For now, simulate a response
    setTimeout(() => {
      const answerText =
        "This is a placeholder response. RAG backend integration coming soon. Your question was: " +
        questionText;

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answerText,
        question: questionText,
        rawData: {
          question: {
            text: questionText,
            timestamp: new Date().toISOString(),
          },
          answer: {
            text: answerText,
            // TODO: When RAG is integrated, add real data:
            // citations: ["Page 5, Section 2.3"],
            // pages: [5, 12, 18],
            // checklists: [...],
            // confidence: 0.95
          },
        },
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative h-[calc(100vh-280px)] px-40">
      {/* Document Info Header */}
      <div className="px-6 py-4 b border-gray-200 bg-white rounded-t-xl border-x border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {document?.file_name || "Document"}
                </p>
                {categoryLabel && categoryStyle && (
                  <span
                    className={cn(
                      "px-2 py-0.5 text-xs font-medium rounded-full",
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
          // Welcome message
          <div className="flex items-center justify-center h-full">
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
                  <p
                    className={cn(
                      "text-sm whitespace-pre-wrap leading-relaxed",
                      message.role === "assistant" && "text-gray-900 text-md",
                    )}
                  >
                    {message.content}
                  </p>

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
                          /* TODO: Send response */
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
                        Export
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
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
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
              placeholder="Ask about eligibility criteria, medical tests, visit checklists..."
              disabled={isLoading}
              rows={3}
              className="w-full  h-full p-4 resize-none rounded-2xl border border-gray-300 bg-white  pr-12 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 overflow-hidden"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
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
    </div>
  );
}
