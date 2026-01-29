/**
 * Chat History Section
 * Always-visible list for AppSidebar showing Document AI chat history
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useChats, useDeleteChatSession } from "@/hooks/client/useChats";
import { Plus, Trash2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";

interface ChatHistorySectionProps {
  orgId: string;
}

export function ChatHistorySection({ orgId }: ChatHistorySectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get trialId, documentId, and chatId from URL query params
  const trialId = searchParams.get("trialId");
  const documentId = searchParams.get("documentId");
  const currentChatId = searchParams.get("chatId");

  const { data: chats = [], isLoading } = useChats(
    trialId || "",
    documentId || "",
  );
  const { mutate: deleteChat } = useDeleteChatSession();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleNewChat = () => {
    if (trialId && documentId) {
      // Navigate to Document AI without chatId (creates new chat)
      router.push(ROUTES.APP.DOCUMENT_AI_CHAT(orgId, trialId, documentId));
    }
  };

  const handleDelete = async (e: React.MouseEvent, chatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingId(chatId);

    deleteChat(chatId, {
      onSuccess: () => {
        setDeletingId(null);
      },
      onError: () => {
        setDeletingId(null);
      },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Don't show if no trial or document selected
  if (!trialId || !documentId) {
    return null;
  }

  return (
    <div className="space-y-1">
      {/* Section Header */}
      <div className="px-2 py-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Chat History
        </p>
      </div>

      {/* New Chat Button */}
      <button
        onClick={handleNewChat}
        className="flex items-center gap-2 w-full px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-sm transition-colors"
      >
        <Plus className="h-4 w-4" />
        <span>New Chat</span>
      </button>

      {/* Chat List */}
      {isLoading ? (
        <div className="px-2 py-2 text-xs text-gray-500">Loading...</div>
      ) : chats.length === 0 ? (
        <div className="px-2 py-2 text-xs text-gray-500 flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>No chats yet</span>
        </div>
      ) : (
        <div className="space-y-0.5 h-auto max-h-60 overflow-y-auto">
          {chats.map((chat) => {
            const isActive = currentChatId === chat.id;
            return (
              <Link
                key={chat.id}
                href={ROUTES.APP.DOCUMENT_AI_CHAT(
                  orgId,
                  trialId,
                  documentId,
                  chat.id,
                )}
              >
                <div
                  className={cn(
                    "group flex items-center justify-between gap-2 px-2 py-2 rounded-sm transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100",
                    deletingId === chat.id && "opacity-50 pointer-events-none",
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{chat.title}</p>
                    <p className="text-[10px] text-gray-500">
                      {formatDate(chat.updated_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, chat.id)}
                    className={cn(
                      "opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded shrink-0",
                      isActive && "opacity-100",
                    )}
                    disabled={deletingId === chat.id}
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
