import type { PatientStatus, PatientSex } from "@/services/patients/types";

export const PATIENT_STATUS_OPTIONS: { value: PatientStatus; label: string }[] = [
  { value: "screening", label: "Screening" },
  { value: "enrolled", label: "Enrolled" },
  { value: "completed", label: "Completed" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "screen_failed", label: "Screen Failed" },
];

export const PATIENT_STATUS_STYLES: Record<PatientStatus, string> = {
  screening: "bg-yellow-100 text-yellow-800",
  enrolled: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  withdrawn: "bg-gray-100 text-gray-800",
  screen_failed: "bg-red-100 text-red-800",
};

export const PATIENT_SEX_OPTIONS: { value: PatientSex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
