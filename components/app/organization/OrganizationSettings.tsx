/**
 * OrganizationSettings Component
 * Placeholder for organization settings
 */

"use client";

interface OrganizationSettingsProps {
  orgId: string;
}

export function OrganizationSettings({ orgId }: OrganizationSettingsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Settings</h2>
      <p className="text-sm text-gray-500">
        Organization settings will be available here.
      </p>
    </div>
  );
}
