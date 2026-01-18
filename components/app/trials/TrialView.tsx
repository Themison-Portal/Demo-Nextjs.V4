/**
 * TrialView Component
 * Main wrapper with navigation tabs and content area for trial detail
 */

"use client";

import { NavigationTabs, TabItem } from "@/components/app/shared/NavigationTabs";
import { ROUTES } from "@/lib/routes";
import { LayoutDashboard, FileText, Users, UserRound } from "lucide-react";
import { TrialOverview } from "./TrialOverview";

type ValidTab = "overview" | "documentation" | "team" | "patients";

interface TrialViewProps {
  orgId: string;
  trialId: string;
  activeTab: ValidTab;
}

export function TrialView({ orgId, trialId, activeTab }: TrialViewProps) {
  const tabs: TabItem[] = [
    {
      label: "Overview",
      value: "overview",
      href: ROUTES.APP.TRIAL_TAB(orgId, trialId, "overview"),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Documentation",
      value: "documentation",
      href: ROUTES.APP.TRIAL_TAB(orgId, trialId, "documentation"),
      icon: <FileText className="h-4 w-4" />,
    },
    {
      label: "Team",
      value: "team",
      href: ROUTES.APP.TRIAL_TAB(orgId, trialId, "team"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Patients",
      value: "patients",
      href: ROUTES.APP.TRIAL_TAB(orgId, trialId, "patients"),
      icon: <UserRound className="h-4 w-4" />,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <TrialOverview orgId={orgId} trialId={trialId} />;
      case "documentation":
        return <PlaceholderTab title="Documentation" description="Trial documents and protocols will be managed here." />;
      case "team":
        return <PlaceholderTab title="Team" description="Manage trial team members and their roles." />;
      case "patients":
        return <PlaceholderTab title="Patients" description="Track and manage enrolled patients." />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <NavigationTabs
        tabs={tabs}
        backLink={{
          label: "All Trials",
          href: ROUTES.APP.TRIALS(orgId),
        }}
      />
      {renderContent()}
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
