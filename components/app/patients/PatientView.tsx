/**
 * Patient View Component
 * Main wrapper with navigation tabs and content area for patient detail
 */

"use client";

import { NavigationTabs, TabItem } from "@/components/app/shared/NavigationTabs";
import { ROUTES } from "@/lib/routes";
import { LayoutDashboard, Calendar, FileText } from "lucide-react";
import { PatientOverview } from "./PatientOverview";
import { VisitsTab } from "./VisitsTab";

type ValidTab = "overview" | "visits" | "documents";

interface PatientViewProps {
  orgId: string;
  trialId: string;
  patientId: string;
  activeTab: ValidTab;
}

export function PatientView({ orgId, trialId, patientId, activeTab }: PatientViewProps) {
  const tabs: TabItem[] = [
    {
      label: "Overview",
      value: "overview",
      href: ROUTES.APP.PATIENT_TAB(orgId, trialId, patientId, "overview"),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Visits",
      value: "visits",
      href: ROUTES.APP.PATIENT_TAB(orgId, trialId, patientId, "visits"),
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      label: "Documents",
      value: "documents",
      href: ROUTES.APP.PATIENT_TAB(orgId, trialId, patientId, "documents"),
      icon: <FileText className="h-4 w-4" />,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <PatientOverview orgId={orgId} trialId={trialId} patientId={patientId} />;
      case "visits":
        return <VisitsTab orgId={orgId} trialId={trialId} patientId={patientId} />;
      case "documents":
        return <PlaceholderTab title="Documents" description="Patient documents will be managed here." />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <NavigationTabs
        tabs={tabs}
        backLink={{
          label: "All Patients",
          href: ROUTES.APP.TRIAL_TAB(orgId, trialId, "patients"),
        }}
      />
      <div className="animate-in fade-in duration-300">
        {renderContent()}
      </div>
    </div>
  );
}

// Placeholder component for tabs not yet implemented
function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <h2 className="text-lg font-medium text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}
