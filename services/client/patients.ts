import type {
  PatientListResponse,
  Patient,
  CreatePatientInput,
  UpdatePatientInput,
  EnrollPatientInput,
  EnrollmentPreview,
} from "@/services/patients/types";

export async function getPatients(
  orgId: string,
  trialId: string
): Promise<PatientListResponse> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients`,
    { method: "GET", credentials: "include" }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch patients");
  }
  return response.json();
}

export async function getPatientById(
  orgId: string,
  trialId: string,
  patientId: string
): Promise<Patient> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients/${patientId}`,
    { method: "GET", credentials: "include" }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch patient");
  }
  return response.json();
}

export async function createPatient(
  orgId: string,
  trialId: string,
  input: CreatePatientInput
): Promise<Patient> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create patient");
  }
  return response.json();
}

export async function updatePatient(
  orgId: string,
  trialId: string,
  patientId: string,
  input: UpdatePatientInput
): Promise<Patient> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients/${patientId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update patient");
  }
  return response.json();
}

export async function deletePatient(
  orgId: string,
  trialId: string,
  patientId: string
): Promise<void> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients/${patientId}`,
    { method: "DELETE", credentials: "include" }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete patient");
  }
}

export async function enrollPatient(
  orgId: string,
  trialId: string,
  patientId: string,
  input: EnrollPatientInput
): Promise<Patient> {
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients/${patientId}/enroll`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to enroll patient");
  }
  return response.json();
}

export async function previewEnrollment(
  orgId: string,
  trialId: string,
  patientId: string,
  baselineDate: string
): Promise<EnrollmentPreview> {
  const params = new URLSearchParams({ baseline_date: baselineDate });
  const response = await fetch(
    `/api/client/${orgId}/trials/${trialId}/patients/${patientId}/enroll/preview?${params.toString()}`,
    {
      method: "GET",
      credentials: "include",
    }
  );
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to preview enrollment");
  }
  return response.json();
}
