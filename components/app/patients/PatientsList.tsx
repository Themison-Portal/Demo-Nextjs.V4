"use client";

import { useState } from "react";
import Link from "next/link";
import { usePatients } from "@/hooks/client/usePatients";
import { useTrialPermissions } from "@/hooks/useTrialPermissions";
import { useTrialDetails } from "@/hooks/client/useTrialDetails";
import { Plus, UserRound } from "lucide-react";
import { CreatePatientModal } from "./CreatePatientModal";
import { formatDate } from "@/lib/date";
import { PATIENT_STATUS_STYLES } from "@/lib/constants/patients";
import { ROUTES } from "@/lib/routes";

interface PatientsListProps {
  orgId: string;
  trialId: string;
}

export function PatientsList({ orgId, trialId }: PatientsListProps) {
  const { patients, isLoading, createPatient, isCreating } = usePatients(
    orgId,
    trialId
  );
  const { teamMembers } = useTrialDetails(orgId, trialId);
  const { canManagePatients } = useTrialPermissions(orgId, teamMembers);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreatePatient = async (input: any) => {
    await createPatient(input);
    setIsCreateModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="h-6 w-32 bg-gray-100 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-gray-900">Patients</h2>
            <span className="text-sm text-gray-500">
              {patients.length} {patients.length === 1 ? "patient" : "patients"}
            </span>
          </div>
          {canManagePatients && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Sign New Patient
            </button>
          )}
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <div className="col-span-2">Patient #</div>
        <div className="col-span-2">Initials</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2">Enrollment Date</div>
        <div className="col-span-2">Sex</div>
        <div className="col-span-2">Created</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {patients.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No patients yet. Add patients to get started.
          </div>
        ) : (
          patients.map((patient) => (
            <Link
              key={patient.id}
              href={ROUTES.APP.PATIENT(orgId, trialId, patient.id)}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="col-span-2 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                  <UserRound className="h-4 w-4 text-gray-500" />
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {patient.patient_number}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">
                  {patient.initials || "-"}
                </p>
              </div>
              <div className="col-span-2">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    PATIENT_STATUS_STYLES[patient.status]
                  }`}
                >
                  {patient.status.replace("_", " ")}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">
                  {patient.enrollment_date
                    ? formatDate(patient.enrollment_date)
                    : "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600 capitalize">
                  {patient.sex || "-"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">
                  {formatDate(patient.created_at)}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Modal */}
      {canManagePatients && (
        <CreatePatientModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreatePatient}
          isLoading={isCreating}
        />
      )}
    </div>
  );
}
