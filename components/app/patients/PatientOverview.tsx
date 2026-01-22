/**
 * Patient Overview Component
 * Overview tab content for patient detail page
 * With inline editing - logic delegated to hooks
 */

"use client";

import { useState } from "react";
import { usePatientDetails } from "@/hooks/client/usePatientDetails";
import { useTrialDetails } from "@/hooks/client/useTrialDetails";
import { useTrialPermissions } from "@/hooks/useTrialPermissions";
import { usePatients } from "@/hooks/client/usePatients";
import { parseLocalDate, formatDate } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectPopover } from "@/components/ui/select-popover";
import { EditableText } from "../shared/EditableField";
import { EnrollPatientModal } from "./EnrollPatientModal";
import {
  PATIENT_STATUS_OPTIONS,
  PATIENT_STATUS_STYLES,
  PATIENT_SEX_OPTIONS,
} from "@/lib/constants/patients";
import { UserRound, UserCheck } from "lucide-react";

interface PatientOverviewProps {
  orgId: string;
  trialId: string;
  patientId: string;
}

export function PatientOverview({
  orgId,
  trialId,
  patientId,
}: PatientOverviewProps) {
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const { patient, isLoading, error, updateField, updateDate } =
    usePatientDetails(orgId, trialId, patientId);

  const { teamMembers } = useTrialDetails(orgId, trialId);
  const { canManagePatients } = useTrialPermissions(orgId, teamMembers);
  const { enrollPatient, isEnrolling } = usePatients(orgId, trialId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading patient...</div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-red-500">
          {error?.message || "Patient not found"}
        </div>
      </div>
    );
  }

  // Parse dates for DatePicker (only for editable fields)
  const dateOfBirth = parseLocalDate(patient.date_of_birth);
  const screeningDate = parseLocalDate(patient.screening_date);

  return (
    <>
      <Card>
        <CardContent className="px-6 space-y-4">
          {/* Header with icon and patient number */}
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
              <UserRound className="h-6 w-6 text-gray-500" />
            </div>
            <div className="flex-1 space-y-1 ">
              <h1 className="text-xl font-semibold text-gray-900">
                Patient {patient.patient_number}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    PATIENT_STATUS_STYLES[patient.status]
                  }`}
                >
                  {patient.status.replace("_", " ")}
                </span>
                {patient.initials && (
                  <span className="text-sm text-gray-500">
                    Initials: {patient.initials}
                  </span>
                )}
                {patient.status === "screening" &&
                  patient.baseline_deadline_date && (
                    <div className=" rounded px-2 py-1  ">
                      <p className="text-sm text-red-600">
                        <span className="font-medium">
                          Enrollment deadline:
                        </span>{" "}
                        {formatDate(patient.baseline_deadline_date)}
                      </p>
                    </div>
                  )}
              </div>
              {/* Enrollment deadline warning */}
            </div>

            {/* Enroll button - only show for screening status */}
            {patient.status === "screening" &&
              canManagePatients &&
              patient.screening_date && (
                <Button
                  onClick={() => setShowEnrollModal(true)}
                  size="sm"
                  className="ml-auto"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Enroll Patient
                </Button>
              )}
          </div>

          {/* Patient Number */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-gray-400 uppercase">
              Patient Number
            </h2>
            <EditableText
              value={patient.patient_number}
              placeholder="Patient number"
              onSave={(value) => updateField("patient_number", value)}
              className="text-gray-700 font-medium"
              disabled={!canManagePatients}
            />
          </div>

          {/* Initials */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-gray-400 uppercase">
              Initials
            </h2>
            <EditableText
              value={patient.initials || ""}
              placeholder="Add initials..."
              onSave={(value) => updateField("initials", value || null)}
              className="text-gray-700"
              disabled={!canManagePatients}
            />
          </div>

          {/* Demographics Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-gray-400 uppercase">
                Date of Birth
              </h2>
              <p className="text-sm text-gray-700">
                {patient.date_of_birth
                  ? formatDate(patient.date_of_birth)
                  : "-"}
              </p>
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-gray-400 uppercase">
                Sex
              </h2>
              <p className="text-sm text-gray-700 capitalize">
                {patient.sex || "-"}
              </p>
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Screening Date */}
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-gray-400 uppercase">
                Screening Date
              </h2>
              <p className="text-sm text-gray-700">
                {patient.screening_date
                  ? formatDate(patient.screening_date)
                  : "-"}
              </p>
            </div>

            {/* Baseline Date (Day 0 / Randomization) */}
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-gray-400 uppercase">
                Baseline Date (Day 0)
              </h2>
              <p className="text-sm text-gray-700">
                {patient.baseline_date
                  ? formatDate(patient.baseline_date)
                  : "-"}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-gray-400 uppercase">
              Status
            </h2>
            {canManagePatients ? (
              <SelectPopover
                value={patient.status}
                options={PATIENT_STATUS_OPTIONS}
                onSelect={(value) => updateField("status", value)}
                placeholder="Select status..."
              />
            ) : (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  PATIENT_STATUS_STYLES[patient.status]
                }`}
              >
                {patient.status.replace("_", " ")}
              </span>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <h2 className="text-xs font-medium text-gray-400 uppercase">
              Notes
            </h2>
            <EditableText
              value={patient.notes || ""}
              placeholder="Add notes..."
              onSave={(value) => updateField("notes", value || null)}
              className="text-gray-700"
              multiline
              disabled={!canManagePatients}
            />
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Created {formatDate(patient.created_at)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Enroll Patient Modal */}
      {patient && (
        <EnrollPatientModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          onSubmit={(input) => enrollPatient(patientId, input)}
          isLoading={isEnrolling}
          patient={patient}
          orgId={orgId}
          trialId={trialId}
        />
      )}
    </>
  );
}
