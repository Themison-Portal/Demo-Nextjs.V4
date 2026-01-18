/**
 * Trial Overview Component
 * Overview tab content for trial detail page
 * With inline editing - logic delegated to hooks
 */

"use client";

import Link from "next/link";
import { useTrialDetails } from "@/hooks/client/useTrialDetails";
import { useOrganization } from "@/hooks/client/useOrganization";
import { useTrialPermissions } from "@/hooks/useTrialPermissions";
import { ROUTES } from "@/lib/routes";
import { parseLocalDate } from "@/lib/date";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { SelectPopover } from "@/components/ui/select-popover";
import { InlineInput } from "@/components/ui/inline-input";
import {
  Users,
  ClipboardList,
  Activity,
  User,
  Sparkles,
  FileText,
  UserPlus,
  Upload,
} from "lucide-react";
import { EditableText } from "./EditableField";
import { PISelector } from "./PISelector";
import {
  TRIAL_STATUS_OPTIONS,
  TRIAL_PHASE_OPTIONS,
} from "@/lib/constants/trials";

interface TrialOverviewProps {
  orgId: string;
  trialId: string;
}

export function TrialOverview({ orgId, trialId }: TrialOverviewProps) {
  const {
    trial,
    teamMembers,
    visitSchedules,
    principalInvestigator,
    patientCount,
    activePatientCount,
    pendingTaskCount,
    isLoading,
    error,
    isAddingTeamMember,
    addTeamMemberError,
    // Helpers from hook
    updateField,
    updateDate,
    updateSettings,
    assignPI,
  } = useTrialDetails(orgId, trialId);

  // Get organization members for PI selection
  const { members: orgMembers } = useOrganization(orgId);

  // Get trial-level permissions
  const { canEditTrial, canManageTeam, canAssignPI, isLoading: isPermissionsLoading } = useTrialPermissions(orgId, teamMembers);

  if (isLoading || isPermissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading trial...</div>
      </div>
    );
  }

  if (error || !trial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-red-500">
          {error?.message || "Trial not found"}
        </div>
        <Link
          href={ROUTES.APP.TRIALS(orgId)}
          className="text-blue-600 hover:underline"
        >
          Back to trials
        </Link>
      </div>
    );
  }

  // Parse dates for DatePicker
  const startDate = parseLocalDate(trial.start_date);
  const endDate = parseLocalDate(trial.end_date);

  // Get settings values
  const sponsor = trial.settings?.sponsor || "";
  const location = trial.settings?.location || "";

  return (
    <div className="flex gap-8">
      {/* Left: Main content */}
      <div className="flex-1 space-y-6">
        {/* Trial Info Card */}
        <Card>
          <CardContent className="px-6 space-y-4">
            {/* Header */}
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {trial.name}
              </h1>
              {trial.protocol_number && (
                <p className="text-sm text-gray-500">
                  Protocol number: {trial.protocol_number}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-gray-400 uppercase">
                Description
              </h2>
              <EditableText
                value={trial.description}
                placeholder="Add a description..."
                onSave={(value) => updateField("description", value)}
                multiline
                className="text-gray-700"
                disabled={!canEditTrial}
              />
            </div>

            {/* Principal Investigator */}
            <div className="space-y-2">
              <h2 className="text-xs font-medium text-gray-400 uppercase">
                Principal Investigator
              </h2>
              <PISelector
                currentPIOrgMemberId={principalInvestigator?.org_member_id}
                currentPIName={
                  principalInvestigator?.user?.full_name ||
                  principalInvestigator?.user?.email
                }
                members={orgMembers.map((m) => ({
                  id: m.id,
                  user: m.user
                    ? {
                        id: m.user_id,
                        email: m.user.email,
                        full_name: m.user.full_name,
                        first_name: m.user.first_name,
                        last_name: m.user.last_name,
                      }
                    : null,
                }))}
                onSelect={assignPI}
                isLoading={isAddingTeamMember}
                disabled={!canAssignPI}
              />
              {addTeamMemberError && (
                <p className="text-xs text-red-600">
                  {(addTeamMemberError as any)?.message || "Failed to assign PI"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardContent className="px-4">
            <h3 className="text-xs font-medium text-gray-400 uppercase mb-3">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled
              >
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled
              >
                <FileText className="h-4 w-4" />
                View Protocol
              </Button>
              <Link href={ROUTES.APP.TRIAL_TAB(orgId, trialId, "team")}>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <Users className="h-4 w-4" />
                  Manage Team
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer"
                disabled
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Button>
              <Link href={ROUTES.APP.TRIAL_TAB(orgId, trialId, "patients")}>
                <Button variant="outline" size="sm" className="cursor-pointer">
                  <UserPlus className="h-4 w-4" />
                  Sign a New Patient
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Visit Schedule */}
        {visitSchedules.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-500">
              Visit Schedule ({visitSchedules.length} visits)
            </h2>
            <div className="space-y-2">
              {visitSchedules.map((visit) => (
                <div
                  key={visit.id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm font-medium text-gray-600 w-8">
                    {visit.visit_order}
                  </span>
                  <span className="text-sm text-gray-900 flex-1">
                    {visit.visit_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    Day {visit.days_from_start}
                    {(visit.window_before_days > 0 ||
                      visit.window_after_days > 0) && (
                      <span className="ml-1">
                        (
                        {visit.window_before_days > 0 &&
                          `-${visit.window_before_days}`}
                        {visit.window_before_days > 0 &&
                          visit.window_after_days > 0 &&
                          "/"}
                        {visit.window_after_days > 0 &&
                          `+${visit.window_after_days}`}
                        )
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members */}
        {teamMembers.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-gray-500">
              Team Members ({teamMembers.length})
            </h2>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {member.user?.full_name ||
                        member.user?.email ||
                        "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{member.trial_role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right: Properties sidebar */}
      <div className="w-72 shrink-0">
        <Card className="sticky top-6">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-xs font-medium text-gray-400 uppercase">
              Properties
            </h3>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <SelectPopover
                value={trial.status}
                options={TRIAL_STATUS_OPTIONS}
                onSelect={(value) => updateField("status", value)}
                disabled={!canEditTrial}
              />
            </div>

            {/* Phase */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Phase</span>
              <SelectPopover
                value={trial.phase}
                options={TRIAL_PHASE_OPTIONS}
                placeholder="Select phase"
                onSelect={(value) => updateField("phase", value)}
                disabled={!canEditTrial}
              />
            </div>

            {/* Start Date */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Start</span>
              <DatePicker
                value={startDate}
                onChange={(date) => updateDate("start_date", date ?? null)}
                placeholder="Set date"
                disabled={!canEditTrial}
              />
            </div>

            {/* End Date */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">End</span>
              <DatePicker
                value={endDate}
                onChange={(date) => updateDate("end_date", date ?? null)}
                placeholder="Set date"
                minDate={startDate}
                disabled={!canEditTrial}
              />
            </div>

            {/* Sponsor */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sponsor</span>
              <InlineInput
                value={sponsor}
                placeholder="Add sponsor"
                onSave={(value) => updateSettings("sponsor", value)}
                className="w-[130px]"
                disabled={!canEditTrial}
              />
            </div>

            {/* Location */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Location</span>
              <InlineInput
                value={location}
                placeholder="Add location"
                onSave={(value) => updateSettings("location", value)}
                className="w-[130px]"
                disabled={!canEditTrial}
              />
            </div>

            <hr className="border-gray-100" />

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  Patients
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {activePatientCount} / {patientCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ClipboardList className="h-4 w-4" />
                  Tasks
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {pendingTaskCount} pending
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Activity className="h-4 w-4" />
                  Visits
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {visitSchedules.length} scheduled
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
