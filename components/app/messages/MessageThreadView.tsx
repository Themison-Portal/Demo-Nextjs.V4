/**
 * Message Thread View
 * Right column showing conversation thread with all messages
 */

"use client";

import { useEffect, useState } from "react";
import {
  useReplyToThread,
  useMarkThreadAsRead,
} from "@/hooks/client/useThreads";
import { useAuth } from "@/hooks/useAuth";
import { AttachmentRenderer } from "./AttachmentRenderer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Reply, Send } from "lucide-react";
import { format } from "date-fns";
import type { MessageThread } from "@/services/threads/types";

type FilterType = "inbox" | "unread" | "sent" | "draft";

interface MessageThreadViewProps {
  thread: MessageThread | null;
  orgId: string;
  currentFilter?: FilterType;
  onFilterChange?: (filter: FilterType) => void;
}

export function MessageThreadView({
  thread,
  orgId,
  currentFilter,
  onFilterChange,
}: MessageThreadViewProps) {
  const { user } = useAuth();
  const { replyToThread, isReplying: isSending } = useReplyToThread(
    orgId,
    thread?.id || "",
  );
  const { markAsRead } = useMarkThreadAsRead(orgId);

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);

  // Mark thread as read when opened
  useEffect(() => {
    if (thread?.id && user?.id) {
      // Check if current user is a participant
      const currentUserParticipant = thread.participants?.find(
        (p) => p.user_id === user.id,
      );

      if (currentUserParticipant) {
        const lastMessage = thread.messages?.[thread.messages.length - 1];
        const hasUnreadMessages = !currentUserParticipant.last_read_message_id ||
          (lastMessage && lastMessage.id !== currentUserParticipant.last_read_message_id);

        // Mark as read if there are unread messages
        if (hasUnreadMessages) {
          markAsRead(thread.id)
            .then(() => {
              // If viewing from Unread filter, switch to Inbox so thread stays visible
              if (currentFilter === "unread" && onFilterChange) {
                onFilterChange("inbox");
              }
            })
            .catch((err) => {
              console.error("Failed to mark as read:", err);
            });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread?.id, user?.id]);

  const handleSendReply = async () => {
    if (!thread || !replyText.trim()) {
      setReplyError("Please enter a reply message");
      return;
    }

    setReplyError(null);

    try {
      await replyToThread({
        content: replyText.trim(),
      });

      // Reset reply form
      setReplyText("");
      setIsReplying(false);
    } catch (err: any) {
      setReplyError(err.message || "Failed to send reply");
    }
  };

  // Empty state
  if (!thread) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 space-y-2 px-4">
          <Mail className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm">Select a conversation to view</p>
        </div>
      </div>
    );
  }

  const toParticipants =
    thread.participants?.filter((p) => p.participant_type === "to") || [];
  const ccParticipants =
    thread.participants?.filter((p) => p.participant_type === "cc") || [];
  const messages = thread.messages || [];

  return (
    <div className="h-full flex flex-col ">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 space-y-3">
        {/* Subject */}
        <h2 className="text-lg font-semibold text-gray-900">
          {thread.subject}
        </h2>

        {/* Meta Info */}
        <div className="space-y-2 text-xs">
          {/* From */}
          <div className="flex items-start gap-2">
            <span className="text-gray-500 font-medium w-16">From:</span>
            <span className="text-gray-900">
              {thread.creator?.full_name || thread.creator?.email || "Unknown"}
            </span>
          </div>

          {/* To */}
          {toParticipants.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium w-16">To:</span>
              <div className="flex-1">
                {toParticipants.map((p, i) => (
                  <span key={p.user_id}>
                    {p.user?.full_name || p.user?.email || "Unknown"}
                    {i < toParticipants.length - 1 && ", "}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CC */}
          {ccParticipants.length > 0 && (
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium w-16">CC:</span>
              <div className="flex-1 text-gray-600">
                {ccParticipants.map((p, i) => (
                  <span key={p.user_id}>
                    {p.user?.full_name || p.user?.email || "Unknown"}
                    {i < ccParticipants.length - 1 && ", "}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Date */}
          <div className="flex items-start gap-2">
            <span className="text-gray-500 font-medium w-16">Date:</span>
            <span className="text-gray-600">
              {format(new Date(thread.created_at), "PPpp")}
            </span>
          </div>

          {/* Trial Context */}
          {thread.trial && (
            <div className="flex items-start gap-2">
              <span className="text-gray-500 font-medium w-16">Trial:</span>
              <span className="text-gray-600">{thread.trial.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message, index) => {
          const isFirstMessage = index === 0;
          const isCurrentUser = message.sent_by === user?.id;

          // Get sender initials for avatar
          const senderName =
            message.sender?.full_name || message.sender?.email || "U";
          const initials = senderName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div key={message.id} className="">
              {/* Message */}
              <div className="flex gap-2 mt-8">
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    isCurrentUser
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {initials}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {message.sender?.full_name ||
                        message.sender?.email ||
                        "Unknown"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(message.sent_at), "PPp")}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>

                  {/* Attachment (first message only) */}
                  {isFirstMessage &&
                    message.attachments &&
                    message.attachments.length > 0 && (
                      <div className="mt-3 border-t border-gray-200 pt-3">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Attachment
                        </h4>
                        <AttachmentRenderer
                          attachment={message.attachments[0]}
                          orgId={orgId}
                        />
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Reply Form */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="space-y-3">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your reply..."
              rows={4}
              disabled={isSending}
            />

            {replyError && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {replyError}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={handleSendReply}
                disabled={isSending || !replyText.trim()}
                size="sm"
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSending ? "Sending..." : "Send Reply"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsReplying(false);
                  setReplyText("");
                  setReplyError(null);
                }}
                disabled={isSending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
