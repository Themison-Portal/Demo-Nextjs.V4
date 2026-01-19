import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

interface PageProps {
  params: Promise<{
    orgId: string;
    trialId: string;
    patientId: string;
  }>;
}

export default async function PatientPage({ params }: PageProps) {
  const { orgId, trialId, patientId } = await params;

  // Redirect to overview tab by default
  redirect(ROUTES.APP.PATIENT_TAB(orgId, trialId, patientId, "overview"));
}
