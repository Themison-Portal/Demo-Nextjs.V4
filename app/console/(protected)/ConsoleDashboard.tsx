/**
 * Console Dashboard Component
 * Main dashboard for staff console (client component)
 */

'use client';

import { useEffect, useState } from 'react';
import { ConsoleSidebar } from '@/components/console/ConsoleSidebar';
import { StatCard } from '@/components/console/StatCard';
import { OrganizationList } from '@/components/console/OrganizationList';
import { CreateOrgModal } from '@/components/console/CreateOrgModal';
import { useOrganizations } from '@/hooks/useOrganizations';
import { Button } from '@/components/ui/button';

interface ConsoleDashboardProps {
  userEmail: string;
}

export function ConsoleDashboard({ userEmail }: ConsoleDashboardProps) {
  const {
    organizations,
    isLoading,
    error,
    fetchOrganizations,
    createOrganization,
  } = useOrganizations();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  // Calculate stats
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter((org) => !org.deleted_at).length;
  const totalUsers = organizations.reduce(
    (sum, org) => sum + (org.member_count || 0),
    0
  );

  // Get recent organizations (first 3)
  const recentOrgs = organizations.slice(0, 3);

  const handleCreateOrg = async (data: {
    name: string;
    primary_owner_email: string;
    additional_owner_emails: string[];
    support_enabled: boolean;
  }) => {
    const result = await createOrganization(data);
    if (result) {
      setIsCreateModalOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <ConsoleSidebar userEmail={userEmail} userRole="Super Admin" />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">
              Platform overview
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Stats Grid */}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Total Organizations"
              value={totalOrgs}
              icon={
                <svg
                  className="h-6 w-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              }
              iconBgColor="bg-blue-50"
            />

            <StatCard
              title="Active Organizations"
              value={activeOrgs}
              icon={
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              iconBgColor="bg-green-50"
            />

            <StatCard
              title="Total Users"
              value={totalUsers}
              icon={
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
              iconBgColor="bg-yellow-50"
            />
          </div>

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
                  onClick={() => fetchOrganizations()}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'View all'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsCreateModalOpen(true)}
                  disabled={isLoading}
                >
                  + Create Organization
                </Button>
              </div>
            </div>

            {isLoading && !organizations.length ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              </div>
            ) : (
              <OrganizationList organizations={recentOrgs} />
            )}
          </div>
        </div>
      </div>

      {/* Create Organization Modal */}
      <CreateOrgModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrg}
        isLoading={isLoading}
      />
    </div>
  );
}
