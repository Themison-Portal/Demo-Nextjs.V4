import { apiClient } from "@/lib/apiClient";
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
    const patients = await apiClient.getPatients(trialId);
    const arr = Array.isArray(patients) ? patients : (patients as any)?.patients || [];

    const mapped = arr.map((p: any) => ({
        ...p,
        patient_number: p.patient_code,
        initials: p.patient_first_name && p.patient_last_name
            ? `${p.patient_first_name[0]}${p.patient_last_name[0]}`
            : p.patient_code || '-',
        status: p.status || 'enrolled',
        screening_date: p.enrollment_date || null,
        sex: p.gender || null,
    }));

    return { patients: mapped, total: mapped.length };
}

export async function getPatientById(
    orgId: string,
    trialId: string,
    patientId: string
): Promise<Patient> {
    return apiClient.getPatientById(patientId) as Promise<Patient>;
}

export async function createPatient(
    orgId: string,
    trialId: string,
    input: CreatePatientInput
): Promise<Patient> {
    const payload = {
        patient_code: (input as any).patient_number || (input as any).patient_code,
        organization_id: orgId,
        date_of_birth: (input as any).date_of_birth || null,
        gender: (input as any).sex || (input as any).gender || null,
        screening_notes: (input as any).notes || null,
    };

    const patient = await apiClient.createPatient(payload) as Patient;
    await apiClient.enrollInTrial(trialId, (patient as any).id);
    return patient;
}

export async function updatePatient(
    orgId: string,
    trialId: string,
    patientId: string,
    input: UpdatePatientInput
): Promise<Patient> {
    return apiClient.updatePatient(patientId, input) as Promise<Patient>;
}

export async function deletePatient(
    orgId: string,
    trialId: string,
    patientId: string
): Promise<void> {
    return apiClient.deletePatient(patientId);
}

export async function enrollPatient(
    orgId: string,
    trialId: string,
    patientId: string,
    input: EnrollPatientInput
): Promise<Patient> {
    return apiClient.updatePatient(patientId, input) as Promise<Patient>;
}

export async function previewEnrollment(
    orgId: string,
    trialId: string,
    patientId: string,
    baselineDate: string
): Promise<EnrollmentPreview> {
    // Call the hydration service preview
    const { previewEnrollment: preview } = await import(
        "@/services/visits/hydration"
    );
    return preview(patientId, trialId, baselineDate);
}