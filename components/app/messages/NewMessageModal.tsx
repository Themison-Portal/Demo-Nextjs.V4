/**
 * New Message Modal
 * Modal for composing and sending new message threads
 */

"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateThread } from "@/hooks/client/useThreads";
import { useOrganization } from "@/hooks/client/useOrganization";
import { useTrials } from "@/hooks/client/useTrials";
import { X, Plus, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewMessageModalProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function NewMessageModal({
  orgId,
  isOpen,
  onClose,
}: NewMessageModalProps) {
  const { createThread, isCreating } = useCreateThread(orgId);
  const { members } = useOrganization(orgId);
  const { trials } = useTrials(orgId);

  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [toUserIds, setToUserIds] = useState<string[]>([]);
  const [ccUserIds, setCcUserIds] = useState<string[]>([]);
  const [selectedTrialId, setSelectedTrialId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Available members (exclude already selected)
  const availableToMembers = members.filter(
    (m) => !toUserIds.includes(m.user_id) && !ccUserIds.includes(m.user_id),
  );
  const availableCcMembers = members.filter(
    (m) => !ccUserIds.includes(m.user_id) && !toUserIds.includes(m.user_id),
  );

  const handleAddTo = (userId: string) => {
    setToUserIds([...toUserIds, userId]);
  };

  const handleRemoveTo = (userId: string) => {
    setToUserIds(toUserIds.filter((id) => id !== userId));
  };

  const handleAddCc = (userId: string) => {
    setCcUserIds([...ccUserIds, userId]);
  };

  const handleRemoveCc = (userId: string) => {
    setCcUserIds(ccUserIds.filter((id) => id !== userId));
  };

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!content.trim()) {
      setError("Message content is required");
      return;
    }
    if (toUserIds.length === 0) {
      setError("At least one recipient (To) is required");
      return;
    }

    try {
      await createThread({
        subject: subject.trim(),
        content: content.trim(),
        to_users: toUserIds,
        cc_users: ccUserIds.length > 0 ? ccUserIds : undefined,
        trial_id: selectedTrialId || undefined,
      });

      // Reset form and close
      setSubject("");
      setContent("");
      setToUserIds([]);
      setCcUserIds([]);
      setSelectedTrialId(null);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    }
  };

  const selectedToMembers = members.filter((m) =>
    toUserIds.includes(m.user_id),
  );
  const selectedCcMembers = members.filter((m) =>
    ccUserIds.includes(m.user_id),
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="space-y-4 p-6">
        {/* Header */}
        <div className="border-b border-gray-200 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
        </div>

        {/* Subject */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject"
            disabled={isCreating}
          />
        </div>

        {/* To Recipients */}
        <div className="space-y-2">
          <Label>To: *</Label>

          {/* Selected recipients */}
          {selectedToMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
              {selectedToMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded"
                >
                  <span>{member.user.full_name || member.user.email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTo(member.user_id)}
                    className="hover:text-blue-900"
                    disabled={isCreating}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add recipient dropdown */}
          {availableToMembers.length > 0 && (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              onChange={(e) => {
                if (e.target.value) {
                  handleAddTo(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={isCreating}
            >
              <option value="">Add recipient...</option>
              {availableToMembers.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user.full_name || member.user.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* CC Recipients */}
        <div className="space-y-2">
          <Label>CC:</Label>

          {/* Selected CC recipients */}
          {selectedCcMembers.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-md border border-gray-200">
              {selectedCcMembers.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center gap-1 bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded"
                >
                  <span>{member.user.full_name || member.user.email}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCc(member.user_id)}
                    className="hover:text-gray-900"
                    disabled={isCreating}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add CC recipient dropdown */}
          {availableCcMembers.length > 0 && (
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              onChange={(e) => {
                if (e.target.value) {
                  handleAddCc(e.target.value);
                  e.target.value = "";
                }
              }}
              disabled={isCreating}
            >
              <option value="">Add CC recipient...</option>
              {availableCcMembers.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.user.full_name || member.user.email}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Attach Trial */}
        <div className="space-y-2">
          <Label htmlFor="trial">Attach Trial (optional)</Label>
          <select
            id="trial"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            value={selectedTrialId || ""}
            onChange={(e) => setSelectedTrialId(e.target.value || null)}
            disabled={isCreating}
          >
            <option value="">None</option>
            {trials.map((trial) => (
              <option key={trial.id} value={trial.id}>
                {trial.name}
              </option>
            ))}
          </select>
        </div>

        {/* Message Content */}
        <div className="space-y-2">
          <Label htmlFor="content">Message *</Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            disabled={isCreating}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isCreating}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isCreating ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
