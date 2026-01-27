/**
 * Messages Inbox
 * 3-column Finder-style layout for message threads
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { MessageThreadList } from "./MessageThreadList";
import { MessageThreadView } from "./MessageThreadView";
import { NewMessageModal } from "./NewMessageModal";
import { useThreads } from "@/hooks/client/useThreads";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Mail, Inbox, Send, FileEdit, Plus } from "lucide-react";
import type { MessageThread } from "@/services/threads/types";

type FilterType = "inbox" | "unread" | "sent" | "draft";

interface MessagesInboxProps {
  orgId: string;
  trialId?: string;
}

export function MessagesInbox({ orgId, trialId }: MessagesInboxProps) {
  const { user } = useAuth();
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(
    null,
  );
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("inbox");
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);

  // Fetch all threads
  const { threads } = useThreads(
    orgId,
    trialId ? { trial_id: trialId } : undefined,
  );

  // Update selectedThread when threads change (e.g., after reply)
  useEffect(() => {
    if (selectedThread && threads.length > 0) {
      const updatedThread = threads.find((t) => t.id === selectedThread.id);
      if (updatedThread) {
        setSelectedThread(updatedThread);
      }
    }
  }, [threads, selectedThread]);

  // Filter threads based on selected filter
  const filteredThreads = useMemo(() => {
    if (!user?.id) return threads;

    let filtered: typeof threads = [];

    switch (selectedFilter) {
      case "unread":
        filtered = threads.filter((thread) => {
          const currentUserParticipant = thread.participants?.find(
            (p) => p.user_id === user.id
          );
          const lastMessage = thread.messages?.[thread.messages.length - 1];
          return currentUserParticipant && (
            !currentUserParticipant.last_read_message_id ||
            (lastMessage && lastMessage.id !== currentUserParticipant.last_read_message_id)
          );
        });
        break;

      case "sent":
        // Only threads created by user with no replies from others
        filtered = threads.filter((thread) => {
          // Must be created by current user
          if (thread.created_by !== user.id) return false;

          // Check if there are any messages from other users (replies)
          const messages = thread.messages || [];
          const hasReplies = messages.some((msg) => msg.sent_by !== user.id);

          // Only show if there are NO replies from others
          return !hasReplies;
        });
        break;

      case "draft":
        // TODO: Implement draft functionality
        filtered = [];
        break;

      case "inbox":
      default:
        // Threads with replies from others (active conversations)
        filtered = threads.filter((thread) => {
          const messages = thread.messages || [];

          // If user is the creator, only show if there are replies from others
          if (thread.created_by === user.id) {
            return messages.some((msg) => msg.sent_by !== user.id);
          }

          // If user is a participant (not creator), always show
          return true;
        });
        break;
    }

    // Sort by last message time (newest first)
    return filtered.sort((a, b) => {
      const aLastMessage = a.messages?.[a.messages.length - 1];
      const bLastMessage = b.messages?.[b.messages.length - 1];

      const aTime = aLastMessage?.sent_at || a.created_at;
      const bTime = bLastMessage?.sent_at || b.created_at;

      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }, [threads, selectedFilter, user?.id]);

  // Count threads for each filter
  const counts = useMemo(() => {
    if (!user?.id) return { inbox: 0, unread: 0, sent: 0, draft: 0 };

    const unread = threads.filter((thread) => {
      const currentUserParticipant = thread.participants?.find(
        (p) => p.user_id === user.id
      );
      const lastMessage = thread.messages?.[thread.messages.length - 1];
      return currentUserParticipant && (
        !currentUserParticipant.last_read_message_id ||
        (lastMessage && lastMessage.id !== currentUserParticipant.last_read_message_id)
      );
    }).length;

    // Count sent (created by user with no replies)
    const sent = threads.filter((thread) => {
      if (thread.created_by !== user.id) return false;
      const messages = thread.messages || [];
      const hasReplies = messages.some((msg) => msg.sent_by !== user.id);
      return !hasReplies;
    }).length;

    // Count inbox (threads with replies from others)
    const inbox = threads.filter((thread) => {
      const messages = thread.messages || [];
      if (thread.created_by === user.id) {
        return messages.some((msg) => msg.sent_by !== user.id);
      }
      return true;
    }).length;

    return {
      inbox,
      unread,
      sent,
      draft: 0, // TODO: Implement draft count
    };
  }, [threads, user?.id]);

  const handleThreadSelect = (thread: MessageThread) => {
    setSelectedThread(thread);
  };

  const filters: Array<{
    type: FilterType;
    label: string;
    icon: React.ReactNode;
    count: number;
  }> = [
    {
      type: "inbox",
      label: "Inbox",
      icon: <Inbox className="h-4 w-4" />,
      count: counts.inbox,
    },
    {
      type: "unread",
      label: "Unread",
      icon: <Mail className="h-4 w-4" />,
      count: counts.unread,
    },
    {
      type: "sent",
      label: "Sent",
      icon: <Send className="h-4 w-4" />,
      count: counts.sent,
    },
    {
      type: "draft",
      label: "Draft",
      icon: <FileEdit className="h-4 w-4" />,
      count: counts.draft,
    },
  ];

  return (
    <>
      <div className="flex h-[calc(100vh-22vh)] bg-white border border-gray-200 rounded-lg overflow-hidden relative">
        {/* Left Column: Filters */}
        <div className="w-64 border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Folders
              </h3>
              <Button
                size="sm"
                onClick={() => setIsNewMessageModalOpen(true)}
                className="gap-1 h-7 text-xs"
              >
                <Plus className="h-3 w-3" />
                New
              </Button>
            </div>
          <div className="space-y-1">
            {filters.map((filter) => (
              <button
                key={filter.type}
                onClick={() => setSelectedFilter(filter.type)}
                disabled={filter.type === "draft"}
                className={cn(
                  "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  selectedFilter === filter.type
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50",
                  filter.type === "draft" && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  {filter.icon}
                  <span>{filter.label}</span>
                </div>
                <span
                  className={cn(
                    "text-xs font-medium",
                    selectedFilter === filter.type
                      ? "text-blue-600"
                      : "text-gray-400"
                  )}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Column: Thread List */}
      <div className="w-80 border-r border-gray-200 overflow-y-auto">
        <MessageThreadList
          orgId={orgId}
          threads={filteredThreads}
          selectedThreadId={selectedThread?.id || null}
          onSelectThread={handleThreadSelect}
        />
      </div>

      {/* Right Column: Thread Detail */}
      <div className="flex-1 overflow-y-auto">
        <MessageThreadView
          thread={selectedThread}
          orgId={orgId}
          currentFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />
      </div>
    </div>

      {/* New Message Modal */}
      <NewMessageModal
        orgId={orgId}
        isOpen={isNewMessageModalOpen}
        onClose={() => setIsNewMessageModalOpen(false)}
      />
    </>
  );
}
