/**
 * Patient Overview Component
 * Overview tab content for patient detail page
 * With inline editing - logic delegated to hooks
 */

"use client";

import { useState, useMemo } from "react";
import { usePatientDetails } from "@/hooks/client/usePatientDetails";
import { useTrialDetails } from "@/hooks/client/useTrialDetails";
import { useTrialPermissions } from "@/hooks/useTrialPermissions";
import { usePatients } from "@/hooks/client/usePatients";
import { useTasks } from "@/hooks/client/useTasks";
import { usePatientVisits } from "@/hooks/client/usePatientVisits";
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
import { UserRound, UserCheck, CheckCircle2, Circle, Calendar, Clock, Send } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { toast } from "@/lib/toast";

interface PatientOverviewProps {
  orgId: string;
  trialId: string;
  patientId: string;
}

// Helper: Calculate age from date of birth
function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Helper: Calculate days between two dates
function daysBetween(date1: string, date2: Date = new Date()): number {
  const d1 = new Date(date1);
  const d2 = date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
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

  // Get patient's visits
  const { visits, isLoading: visitsLoading } = usePatientVisits(orgId, trialId, patientId);

  // Get patient's pending tasks
  const { tasks: patientTasks } = useTasks(orgId, {
    patient_id: patientId,
    status: 'todo' // Only show pending tasks
  });

  // Calculate stats
  const stats = useMemo(() => {
    if (!patient) return null;

    // Age
    const age = calculateAge(patient.date_of_birth);

    // Days in trial (from baseline_date if enrolled)
    const daysInTrial = patient.baseline_date ? daysBetween(patient.baseline_date) : null;

    // Visit completion
    const totalVisits = visits.length;
    const completedVisits = visits.filter(v => v.status === 'completed').length;
    const visitCompletionRate = totalVisits > 0
      ? Math.round((completedVisits / totalVisits) * 100)
      : 0;

    // Next visit
    const upcomingVisits = visits
      .filter(v => v.status === 'scheduled' || v.status === 'rescheduled')
      .sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
    const nextVisit = upcomingVisits[0];

    // Pending tasks count
    const pendingTasksCount = patientTasks.length;

    return {
      age,
      daysInTrial,
      totalVisits,
      completedVisits,
      visitCompletionRate,
      nextVisit,
      pendingTasksCount,
    };
  }, [patient, visits, patientTasks]);

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
      <div className="space-y-4">
        {/* Header Card */}
        <Card>
          <CardContent className="px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold text-gray-900">
                    Patient {patient.patient_number}
                  </h1>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      PATIENT_STATUS_STYLES[patient.status]
                    }`}
                  >
                    {patient.status.replace("_", " ")}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="capitalize">{patient.sex || "—"}</span>
                  {stats?.age && <span>{stats.age} years</span>}
                  {patient.initials && <span>• {patient.initials}</span>}
                  {patient.date_of_birth && (
                    <span className="text-gray-400">
                      • Born {formatDate(patient.date_of_birth)}
                    </span>
                  )}
                </div>

                {patient.status === "screening" && patient.baseline_deadline_date && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <Clock className="h-4 w-4" />
                    <span>
                      Enrollment deadline: {formatDate(patient.baseline_deadline_date)}
                    </span>
                  </div>
                )}
              </div>

              {patient.status === "screening" &&
                canManagePatients &&
                patient.screening_date && (
                  <Button onClick={() => setShowEnrollModal(true)} size="sm">
                    <UserCheck className="h-4 w-4 mr-2" />
                    Enroll Patient
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        {stats && patient.status === "enrolled" && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="px-5 py-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                    Visit Progress
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-gray-900">
                      {stats.completedVisits}/{stats.totalVisits}
                    </span>
                    <span className="text-sm text-gray-500">
                      {stats.visitCompletionRate}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${stats.visitCompletionRate}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {stats.daysInTrial !== null && (
              <Card>
                <CardContent className="px-5 py-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                      Days in Trial
                    </p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stats.daysInTrial}
                    </p>
                    <p className="text-xs text-gray-500">
                      Since {formatDate(patient.baseline_date!)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="px-5 py-4">
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                    Pending Tasks
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats.pendingTasksCount}
                  </p>
                  <Link
                    href={`${ROUTES.APP.TASKS(orgId)}?patient_id=${patientId}`}
                    className="text-xs text-blue-600 hover:text-blue-700 hover:underline inline-block"
                  >
                    View all →
                  </Link>
                </div>
              </CardContent>
            </Card>

            {stats.nextVisit && (
              <Card>
                <CardContent className="px-5 py-4">
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                      Next Visit
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {stats.nextVisit.visit_name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {formatDate(stats.nextVisit.scheduled_date)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        // Simulate sending reminder
                        toast.success(
                          "Reminder sent",
                          `Reminder for ${stats.nextVisit!.visit_name} sent to patient`
                        );
                      }}
                    >
                      <Send className="h-3.5 w-3.5 mr-2" />
                      Send Reminder
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Combined Card - 3 Columns */}
        <Card>
          <CardContent className="px-6 py-6">
            <div className="grid grid-cols-3 gap-8">
              {/* Column 1: Patient Journey */}
              {patient.screening_date && (
                <div>
                  <h2 className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-4">
                    Patient Journey
                  </h2>
                  <div className="relative">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="relative z-10 flex h-4 w-4 items-center justify-center">
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-white" />
                        </div>
                        <div className="-mt-0.5 flex-1">
                          <p className="text-sm font-medium text-gray-900">Screening</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(patient.screening_date)}
                          </p>
                        </div>
                      </div>

                      {patient.baseline_date && (
                        <div className="flex gap-3">
                          <div className="relative z-10 flex h-4 w-4 items-center justify-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-white" />
                          </div>
                          <div className="-mt-0.5 flex-1">
                            <p className="text-sm font-medium text-gray-900">Enrolled</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(patient.baseline_date)}
                            </p>
                          </div>
                        </div>
                      )}

                      {patient.status === "enrolled" && stats?.nextVisit && (
                        <div className="flex gap-3">
                          <div className="relative z-10 flex h-4 w-4 items-center justify-center">
                            <div className="h-2.5 w-2.5 rounded-full bg-blue-500 ring-4 ring-white animate-pulse" />
                          </div>
                          <div className="-mt-0.5 flex-1">
                            <p className="text-sm font-medium text-gray-900">Next Visit</p>
                            <p className="text-xs text-gray-600">
                              {stats.nextVisit.visit_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(stats.nextVisit.scheduled_date)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Column 2: Upcoming Tasks */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">
                    Upcoming Tasks
                  </h2>
                  {patientTasks.length > 0 && (
                    <Link
                      href={`${ROUTES.APP.TASKS(orgId)}?patient_id=${patientId}`}
                      className="text-[10px] text-gray-500 hover:text-gray-700 uppercase tracking-wide"
                    >
                      View all
                    </Link>
                  )}
                </div>
                {patientTasks.length > 0 ? (
                  <div className="space-y-2">
                    {patientTasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="border-l-2 border-gray-200 pl-3">
                        <Link
                          href={`${ROUTES.APP.TASKS(orgId)}?task_id=${task.id}`}
                          className="block group"
                        >
                          <p className="text-sm text-gray-900 group-hover:text-blue-600 transition-colors">
                            {task.title}
                          </p>
                          {task.due_date && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Due {formatDate(task.due_date)}
                            </p>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No pending tasks</p>
                )}
              </div>

              {/* Column 3: Patient Details */}
              <div>
                <h2 className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-4">
                  Patient Details
                </h2>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                      Patient Number
                    </h3>
                    <EditableText
                      value={patient.patient_number}
                      placeholder="Patient number"
                      onSave={(value) => updateField("patient_number", value)}
                      className="text-sm text-gray-900"
                      disabled={!canManagePatients}
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                      Initials
                    </h3>
                    <EditableText
                      value={patient.initials || ""}
                      placeholder="Add initials..."
                      onSave={(value) => updateField("initials", value || null)}
                      className="text-sm text-gray-900"
                      disabled={!canManagePatients}
                    />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </h3>
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

                  <div className="space-y-1">
                    <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                      Notes
                    </h3>
                    <EditableText
                      value={patient.notes || ""}
                      placeholder="Add notes..."
                      onSave={(value) => updateField("notes", value || null)}
                      className="text-sm text-gray-900"
                      multiline
                      disabled={!canManagePatients}
                    />
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Created {formatDate(patient.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enroll Patient Modal */}
      {patient && (
        <EnrollPatientModal
          isOpen={showEnrollModal}
          onClose={() => setShowEnrollModal(false)}
          onSubmit={async (input) => {
            await enrollPatient(patientId, input);
          }}
          isLoading={isEnrolling}
          patient={patient}
          orgId={orgId}
          trialId={trialId}
        />
      )}
    </>
  );
}
