/**
 * OrganizationSettings Component
 * Manage organization settings
 */

"use client";

import { useOrganization } from "@/hooks/client/useOrganization";
import { usePermissions } from "@/hooks/usePermissions";
import { Card, CardContent } from "@/components/ui/card";
import { EditableText } from "@/components/app/shared/EditableField";

interface OrganizationSettingsProps {
  orgId: string;
}

export function OrganizationSettings({ orgId }: OrganizationSettingsProps) {
  const { organization, updateOrganization } = useOrganization(orgId);
  const { canManageOrg } = usePermissions(orgId);

  const address = organization?.settings?.address || "";

  const handleUpdateAddress = async (value: string) => {
    await updateOrganization({
      settings: { address: value },
    });
  };

  if (!organization) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <h2 className="text-lg font-medium text-gray-900">General Settings</h2>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Address</label>
          <EditableText
            value={address}
            placeholder="Add organization address..."
            onSave={handleUpdateAddress}
            disabled={!canManageOrg}
            className="text-gray-700"
          />
        </div>
      </CardContent>
    </Card>
  );
}
