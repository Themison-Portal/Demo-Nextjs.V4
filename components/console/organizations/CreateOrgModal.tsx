/**
 * Create Organization Modal Component
 * Modal form to create new organization
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreateOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    primary_owner_email: string;
    additional_owner_emails: string[];
    support_enabled: boolean;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function CreateOrgModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: CreateOrgModalProps) {
  const [name, setName] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [additionalEmails, setAdditionalEmails] = useState<string[]>([""]);
  const [supportEnabled, setSupportEnabled] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Filter out empty additional emails
    const validAdditionalEmails = additionalEmails.filter((email) =>
      email.trim()
    );

    await onSubmit({
      name,
      primary_owner_email: primaryEmail,
      additional_owner_emails: validAdditionalEmails,
      support_enabled: supportEnabled,
    });

    // Reset form
    setName("");
    setPrimaryEmail("");
    setAdditionalEmails([""]);
    setSupportEnabled(false);
  };

  const handleAddEmail = () => {
    if (additionalEmails.length < 2) {
      setAdditionalEmails([...additionalEmails, ""]);
    }
  };

  const handleRemoveEmail = (index: number) => {
    setAdditionalEmails(additionalEmails.filter((_, i) => i !== index));
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...additionalEmails];
    newEmails[index] = value;
    setAdditionalEmails(newEmails);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Organization
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Organization Name */}
          <div>
            <Label htmlFor="org-name">Organization Name *</Label>
            <Input
              className="mt-2"
              id="org-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mayo Clinic Research"
              required
              disabled={isLoading}
            />
          </div>

          {/* Primary Owner Email */}
          <div>
            <Label htmlFor="primary-email">Primary Owner Email *</Label>
            <Input
              className="mt-2"
              id="primary-email"
              type="email"
              value={primaryEmail}
              onChange={(e) => setPrimaryEmail(e.target.value)}
              placeholder="owner@example.com"
              required
              disabled={isLoading}
            />
          </div>

          {/* Additional Owner Emails */}
          <div>
            <Label className="mb-2">Additional Owner Emails (Optional)</Label>
            <div className="space-y-2">
              {additionalEmails.map((email, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    className="mt-2"
                    type="email"
                    value={email}
                    onChange={(e) => handleEmailChange(index, e.target.value)}
                    placeholder={`owner${index + 2}@example.com`}
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveEmail(index)}
                    disabled={isLoading}
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </div>
              ))}
              {additionalEmails.length < 2 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddEmail}
                  disabled={isLoading}
                >
                  Add Email
                </Button>
              )}
            </div>
          </div>

          {/* Support Mode Toggle */}
          <div className="flex items-center gap-2">
            <input
              id="support-enabled"
              type="checkbox"
              checked={supportEnabled}
              onChange={(e) => setSupportEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-200 text-gray-600 focus:ring-gray-400"
              disabled={isLoading}
            />
            <Label htmlFor="support-enabled" className="cursor-pointer">
              Enable Support Mode (for showcase/demo)
            </Label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !name || !primaryEmail}
              className="flex-1"
            >
              {isLoading ? "Creating..." : "Create Organization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
