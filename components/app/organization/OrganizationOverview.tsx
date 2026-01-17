/**
 * OrganizationOverview Component
 * Displays organization name and basic info
 */

"use client";

import { useOrganization } from "@/hooks/client/useOrganization";

interface OrganizationOverviewProps {
  orgId: string;
}

export function OrganizationOverview({ orgId }: OrganizationOverviewProps) {
  const { organization, isLoading } = useOrganization(orgId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="h-8 w-48 bg-gray-100 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h1 className="text-2xl font-semibold text-gray-900">
        {organization?.name || "Organization"}
      </h1>
    </div>
  );
}
