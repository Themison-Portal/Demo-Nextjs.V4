import { PatientView } from "@/components/app/patients/PatientView";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    orgId: string;
    trialId: string;
    patientId: string;
    tab: string;
  }>;
}

const VALID_TABS = ["overview", "visits", "documents"] as const;

export default async function PatientTabPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { tab } = resolvedParams;

  // Validate tab
  if (!VALID_TABS.includes(tab as any)) {
    notFound();
  }

  return (
    <PatientView
      {...resolvedParams}
      activeTab={tab as "overview" | "visits" | "documents"}
    />
  );
}
