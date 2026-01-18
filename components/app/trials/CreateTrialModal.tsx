/**
 * Create Trial Modal
 * Modal form for creating a new trial
 */

"use client";

import { useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateTrialInput, TrialPhase } from "@/services/trials/types";

interface CreateTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTrialInput) => Promise<void>;
  isSubmitting?: boolean;
}

const PHASES: { value: TrialPhase; label: string }[] = [
  { value: "Phase I", label: "Phase I" },
  { value: "Phase II", label: "Phase II" },
  { value: "Phase III", label: "Phase III" },
  { value: "Phase IV", label: "Phase IV" },
];

export function CreateTrialModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateTrialModalProps) {
  const [name, setName] = useState("");
  const [protocolNumber, setProtocolNumber] = useState("");
  const [phase, setPhase] = useState<TrialPhase | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Trial name is required");
      return;
    }

    try {
      await onSubmit({
        name: name.trim(),
        protocol_number: protocolNumber.trim() || undefined,
        phase: phase || undefined,
        description: description.trim() || undefined,
      });
      // Reset form on success
      setName("");
      setProtocolNumber("");
      setPhase("");
      setDescription("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trial");
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <ModalHeader onClose={handleClose}>Create Trial</ModalHeader>

        <ModalBody className="space-y-4">
          <p className="text-sm text-gray-500">
            Basic information to get started. You can add more details later.
          </p>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <Label htmlFor="name">
              Trial Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Diabetes Study Phase III"
              disabled={isSubmitting}
            />
          </div>

          {/* Protocol Number */}
          <div className="space-y-1">
            <Label htmlFor="protocol">Protocol Number</Label>
            <Input
              id="protocol"
              value={protocolNumber}
              onChange={(e) => setProtocolNumber(e.target.value)}
              placeholder="e.g., PROT-2026-001"
              disabled={isSubmitting}
            />
          </div>

          {/* Phase */}
          <div className="space-y-1">
            <Label htmlFor="phase">Phase</Label>
            <select
              id="phase"
              value={phase}
              onChange={(e) => setPhase(e.target.value as TrialPhase | "")}
              disabled={isSubmitting}
              className="w-full h-9 rounded-md border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">Select phase...</option>
              {PHASES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the trial..."
              disabled={isSubmitting}
              rows={3}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 resize-none"
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Trial"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
