/**
 * Console Dashboard Component
 * Main dashboard for staff console (client component)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatsGrid } from "../shared/StatsGrid";
import { OrganizationList } from "../organizations/OrganizationList";
import { CreateOrgModal } from "../organizations/CreateOrgModal";
import { useOrganizations } from "@/hooks/useOrganizations";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const router = useRouter();
  const {
    recentOrganizations,
    stats,
    isLoading,
    error,
    createOrganization,
    isCreating,
  } = useOrganizations();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateOrg = async (data: {
    name: string;
    primary_owner_email: string;
    additional_owner_emails: string[];
    support_enabled: boolean;
  }) => {
    try {
      await createOrganization(data);
      setIsCreateModalOpen(false);
    } catch (err) {
      // Error is already handled by TanStack Query
      console.error("Failed to create organization:", err);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">Platform overview</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-gray-50 p-4 text-sm text-red-700">
            {error.message || "Failed to load data"}
          </div>
        )}

        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        {/* Recent Organizations Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Recent Organizations
              </h2>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/console/organizations")}
                disabled={isLoading}
              >
                View all
              </Button>
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={isLoading || isCreating}
                className="font-bold "
              >
                + New Organization
              </Button>
            </div>
          </div>

          {isLoading && !recentOrganizations.length ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <OrganizationList organizations={recentOrganizations} />
          )}
        </div>
      </div>

      {/* Create Organization Modal */}
      <CreateOrgModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrg}
        isLoading={isCreating}
      />
    </div>
  );
}
