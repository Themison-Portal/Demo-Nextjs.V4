/**
 * Trials List Component
 * List view of all trials using real data from hook
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FlaskConical, Users, ClipboardList } from "lucide-react";
import { TrialCard } from "./TrialCard";
import { CreateTrialModal } from "./CreateTrialModal";
import { useTrials } from "@/hooks/client/useTrials";
import { usePermissions } from "@/hooks/usePermissions";

interface TrialsListProps {
  orgId: string;
}

export function TrialsList({ orgId }: TrialsListProps) {
  const { trials, isLoading, error, createTrial, isCreating } =
    useTrials(orgId);
  const { canCreateTrial } = usePermissions(orgId);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-gray-500">Loading trials...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-100">
        <div className="text-red-500">{error.message}</div>
      </div>
    );
  }

  // Empty state
  if (trials.length === 0) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-bold text-gray-900">Trials</h1>

        <Card size="sm" className="bg-white border border-gray-100">
          <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-6">
              <FlaskConical className="h-6 w-6 text-blue-600" />
            </div>

            {canCreateTrial ? (
              <>
                <h2 className="text-lg font-normal text-gray-900 mb-2">
                  Create your first clinical trial
                </h2>
                <p className="text-gray-800 max-w-md mb-4">
                  Start managing your clinical research by creating a trial.
                  You'll be able to track patients, schedule visits, and
                  coordinate your team.
                </p>
                <Button
                  className="flex items-center gap-2 mb-8"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Trial</span>
                </Button>
                <CreateTrialModal
                  isOpen={isModalOpen}
                  onClose={() => setIsModalOpen(false)}
                  onSubmit={async (data) => {
                    await createTrial(data);
                  }}
                  isSubmitting={isCreating}
                />
              </>
            ) : (
              <>
                <h2 className="text-lg font-normal text-gray-900 mb-2">
                  No trials assigned
                </h2>
                <p className="text-gray-800 max-w-md mb-4">
                  You don't have any trials assigned yet. Contact your
                  organization admin to be added to a trial team.
                </p>
              </>
            )}

            {/* Feature highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl pt-8 border-t border-gray-200">
              <div className="flex flex-col items-center gap-2">
                <Users className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-800">Team management</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <ClipboardList className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-800">Visit schedules</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <FlaskConical className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-800">Patient tracking</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Select a Trial</h1>
        {canCreateTrial && (
          <Button
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Create New Trial</span>
          </Button>
        )}
      </div>

      {/* Trials Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {trials.map((trial) => (
          <TrialCard
            key={trial.id}
            id={trial.id}
            orgId={orgId}
            name={trial.name}
            phase={trial.phase || "Not specified"}
            location="-"
            principalInvestigator={
              trial.principal_investigator?.full_name ||
              trial.principal_investigator?.email
            }
            protocolNumber={trial?.protocol_number}
          />
        ))}
      </div>

      {canCreateTrial && (
        <CreateTrialModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={async (data) => {
            await createTrial(data);
          }}
          isSubmitting={isCreating}
        />
      )}
    </div>
  );
}
