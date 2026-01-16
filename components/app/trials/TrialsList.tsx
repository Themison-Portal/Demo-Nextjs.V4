/**
 * Trials List Component
 * List view of all trials
 */

"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TrialCard } from "./TrialCard";

interface TrialsListProps {
  orgId: string;
}

// Mockup data
const MOCK_TRIALS = [
  {
    id: "1",
    name: "Colitis #2",
    phase: "Phase I/II",
    location: "Copenhagen",
    role: "Clinical Research Coordinator (CRC)",
    principalInvestigator: "Michael Pavlou",
  },
  {
    id: "2",
    name: "Diabetes - Tirzepatide",
    phase: "Phase III",
    location: "Main Clinical Site",
    role: "Clinical Research Coordinator (CRC)",
    principalInvestigator: "Sarah Johnson",
  },
  {
    id: "3",
    name: "Alzheimer's Prevention Study",
    phase: "Phase II",
    location: "Boston Medical Center",
    role: "Study Coordinator",
    principalInvestigator: "Dr. Emily Chen",
  },
  {
    id: "4",
    name: "Cardiovascular Health Trial",
    phase: "Phase I",
    location: "University Hospital",
    role: "Research Assistant",
    principalInvestigator: "Dr. James Wilson",
  },
  {
    id: "5",
    name: "Cancer Immunotherapy Study",
    phase: "Phase II/III",
    location: "Memorial Cancer Center",
    role: "Clinical Research Coordinator (CRC)",
    principalInvestigator: "Dr. Maria Garcia",
  },
  {
    id: "6",
    name: "Parkinson's Disease Treatment",
    phase: "Phase II",
    location: "Neurology Institute",
    role: "Study Coordinator",
    principalInvestigator: "Dr. Robert Taylor",
  },
];

export function TrialsList({ orgId }: TrialsListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 ">Select a Trial</h1>
        <Button size="sm" variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <span>Create New Trial</span>
        </Button>
      </div>

      {/* Trials Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MOCK_TRIALS.map((trial) => (
          <TrialCard
            key={trial.id}
            id={trial.id}
            orgId={orgId}
            name={trial.name}
            phase={trial.phase}
            location={trial.location}
            role={trial.role}
            principalInvestigator={trial.principalInvestigator}
          />
        ))}
      </div>
    </div>
  );
}
