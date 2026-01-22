"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { previewEnrollment } from "@/services/client/patients";
import { ActivityAssigneeSelect } from "./ActivityAssigneeSelect";
import { useTrialDetails } from "@/hooks/client/useTrialDetails";
import type {
  Patient,
  EnrollPatientInput,
  EnrollmentPreview,
} from "@/services/patients/types";
import { formatDate } from "@/lib/date";

interface EnrollPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: EnrollPatientInput) => Promise<void>;
  isLoading: boolean;
  patient: Patient;
  orgId: string;
  trialId: string;
}

export function EnrollPatientModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  patient,
  orgId,
  trialId,
}: EnrollPatientModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [baselineDate, setBaselineDate] = useState("");
  const [preview, setPreview] = useState<EnrollmentPreview | null>(null);
  const [assigneeOverrides, setAssigneeOverrides] = useState<Record<string, string | null>>({});
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch trial team members
  const { teamMembers } = useTrialDetails(orgId, trialId);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setBaselineDate("");
      setPreview(null);
      setAssigneeOverrides({});
      setError(null);
    }
  }, [isOpen]);

  const handleNext = async () => {
    setError(null);

    if (!baselineDate) {
      setError("Baseline date is required");
      return;
    }

    // Validate baseline_date is after screening_date
    if (patient.screening_date) {
      const screening = new Date(patient.screening_date);
      const baseline = new Date(baselineDate);

      if (baseline <= screening) {
        setError("Baseline date must be after screening date");
        return;
      }

      // Validate baseline_date is before deadline
      if (patient.baseline_deadline_date) {
        const deadline = new Date(patient.baseline_deadline_date);
        if (baseline > deadline) {
          setError(
            `Baseline date must be before ${new Date(
              patient.baseline_deadline_date
            ).toLocaleDateString()}`
          );
          return;
        }
      }
    }

    // Load preview
    setIsLoadingPreview(true);
    try {
      const previewData = await previewEnrollment(
        orgId,
        trialId,
        patient.id,
        baselineDate
      );
      setPreview(previewData);
      setStep(2);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Only include non-empty overrides
      const cleanOverrides = Object.fromEntries(
        Object.entries(assigneeOverrides).filter(([_, value]) => value !== undefined)
      );

      await onSubmit({
        baseline_date: baselineDate,
        assignee_overrides: Object.keys(cleanOverrides).length > 0 ? cleanOverrides : undefined,
      });
      handleClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
    }
  };

  const handleClose = () => {
    setStep(1);
    setBaselineDate("");
    setPreview(null);
    setAssigneeOverrides({});
    setError(null);
    onClose();
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  // Calculate min and max dates for date picker
  const minDate = patient.screening_date
    ? new Date(new Date(patient.screening_date).getTime() + 86400000)
        .toISOString()
        .split("T")[0]
    : undefined;
  const maxDate = patient.baseline_deadline_date
    ? new Date(patient.baseline_deadline_date).toISOString().split("T")[0]
    : undefined;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader>
        Enroll Patient - Step {step} of 2
      </ModalHeader>
      <ModalBody>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Patient: <span className="font-medium text-gray-900">{patient.patient_number}</span>
                {patient.initials && ` (${patient.initials})`}
              </p>
              {patient.screening_date && (
                <p className="text-sm text-gray-600 mb-2">
                  Screening date:{" "}
                  <span className="font-medium text-gray-900">
                    {formatDate(patient.screening_date)}
                  </span>
                </p>
              )}
              {patient.baseline_deadline_date && (
                <p className="text-sm text-gray-600 mb-4">
                  Enrollment deadline:{" "}
                  <span className="font-medium text-gray-900">
                    {formatDate(patient.baseline_deadline_date)}
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseline_date">
                Baseline Date (Day 0) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="baseline_date"
                type="date"
                value={baselineDate}
                onChange={(e) => setBaselineDate(e.target.value)}
                min={minDate}
                max={maxDate}
                disabled={isLoadingPreview}
              />
              <p className="text-xs text-gray-500">
                Select the scheduled date for the baseline visit
              </p>
            </div>

            {error && (
              <div className="border border-gray-300 rounded p-3">
                <p className="text-sm text-gray-900">{error}</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && preview && (
          <div className="space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <p className="text-sm text-gray-600">
                Baseline date:{" "}
                <span className="font-medium text-gray-900">{formatDate(baselineDate)}</span>
              </p>
              <p className="text-sm text-gray-600">
                {preview.total_visits} visits, {preview.total_activities} activities
              </p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {preview.visits.map((visit, idx) => (
                <div key={idx} className="border border-gray-200 rounded p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {visit.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(visit.scheduled_date)}
                        {visit.is_day_zero && " (Day 0)"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1">
                    {visit.activities.map((activity, actIdx) => {
                      // Generate unique key: visit.order + activity.activity_id
                      const overrideKey = `v${visit.order}-${activity.activity_id}`;

                      // Use override if exists, otherwise use default from preview
                      const currentAssignee = assigneeOverrides.hasOwnProperty(overrideKey)
                        ? assigneeOverrides[overrideKey]
                        : activity.assigned_to_user_id;

                      return (
                        <div
                          key={actIdx}
                          className="flex items-center justify-between py-1"
                        >
                          <span className="text-xs text-gray-700">
                            {activity.activity_name}
                          </span>
                          <ActivityAssigneeSelect
                            key={`${overrideKey}-${currentAssignee || 'unassigned'}`}
                            value={currentAssignee}
                            suggestedRole={activity.assigned_to_role}
                            teamMembers={teamMembers}
                            onChange={(userId) =>
                              setAssigneeOverrides((prev) => ({
                                ...prev,
                                [overrideKey]: userId,
                              }))
                            }
                            disabled={isLoading}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="border border-gray-300 rounded p-3">
                <p className="text-sm text-gray-900">{error}</p>
              </div>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        {step === 1 ? (
          <>
            <Button variant="ghost" onClick={handleClose} disabled={isLoadingPreview}>
              Cancel
            </Button>
            <Button onClick={handleNext} disabled={isLoadingPreview || !baselineDate}>
              {isLoadingPreview ? "Loading..." : "Next"}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={handleBack} disabled={isLoading}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Enrolling..." : "Confirm Enrollment"}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
