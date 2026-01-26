/**
 * Modal Trials List
 * Left column - List of trials
 */

"use client";

import { useTrials } from "@/hooks/client/useTrials";
import { FlaskConical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalTrialsListProps {
  orgId: string;
  selectedTrialId: string | null;
  onSelectTrial: (trialId: string) => void;
}

export function ModalTrialsList({
  orgId,
  selectedTrialId,
  onSelectTrial,
}: ModalTrialsListProps) {
  const { trials, isLoading } = useTrials(orgId);

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 bg-gray-100 animate-pulse rounded"
          />
        ))}
      </div>
    );
  }

  if (trials.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6 text-center">
        <div className="space-y-2">
          <FlaskConical className="w-8 h-8 text-gray-300 mx-auto" />
          <p className="text-sm text-gray-500">No trials found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="space-y-0.5">
        {trials.map((trial) => {
          const isSelected = selectedTrialId === trial.id;

          return (
            <button
              key={trial.id}
              onClick={() => onSelectTrial(trial.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition-colors text-left",
                isSelected
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-50"
              )}
            >
              <FlaskConical className="w-4 h-4 shrink-0" />
              <span className="truncate">{trial.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
