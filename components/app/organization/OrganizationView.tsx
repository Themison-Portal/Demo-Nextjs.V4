/**
 * OrganizationView Component
 * Main wrapper with navigation tabs and content area
 */

"use client";

import { NavigationTabs, TabItem } from "@/components/app/shared/NavigationTabs";
import { ROUTES } from "@/lib/routes";
import { LayoutDashboard, Users, Settings } from "lucide-react";
import { OrganizationOverview } from "./OrganizationOverview";
import { OrganizationMembers } from "./OrganizationMembers";
import { OrganizationSettings } from "./OrganizationSettings";

type ValidTab = "overview" | "members" | "settings";

interface OrganizationViewProps {
  orgId: string;
  activeTab: ValidTab;
}

export function OrganizationView({ orgId, activeTab }: OrganizationViewProps) {
  const tabs: TabItem[] = [
    {
      label: "Overview",
      value: "overview",
      href: ROUTES.APP.ORGANIZATION_TAB(orgId, "overview"),
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Members",
      value: "members",
      href: ROUTES.APP.ORGANIZATION_TAB(orgId, "members"),
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Settings",
      value: "settings",
      href: ROUTES.APP.ORGANIZATION_TAB(orgId, "settings"),
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OrganizationOverview orgId={orgId} />;
      case "members":
        return <OrganizationMembers orgId={orgId} />;
      case "settings":
        return <OrganizationSettings orgId={orgId} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <NavigationTabs tabs={tabs} />
      {renderContent()}
    </div>
  );
}
