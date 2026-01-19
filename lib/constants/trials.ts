/**
 * Trial Constants
 * Centralized definitions for trial-related enums and options
 */

import type { TrialPhase, TrialStatus } from "@/services/trials/types";

// ============================================================================
// STATUS
// ============================================================================

export const TRIAL_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed",
  TERMINATED: "terminated",
} as const;

export const TRIAL_STATUS_OPTIONS: { value: TrialStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "terminated", label: "Terminated" },
];

export const TRIAL_STATUS_STYLES: Record<TrialStatus, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  completed: "bg-blue-100 text-blue-800",
  terminated: "bg-red-100 text-red-800",
};

// ============================================================================
// PHASE
// ============================================================================

export const TRIAL_PHASE = {
  PHASE_I: "Phase I",
  PHASE_II: "Phase II",
  PHASE_III: "Phase III",
  PHASE_IV: "Phase IV",
} as const;

export const TRIAL_PHASE_OPTIONS: { value: TrialPhase; label: string }[] = [
  { value: "Phase I", label: "Phase I" },
  { value: "Phase II", label: "Phase II" },
  { value: "Phase III", label: "Phase III" },
  { value: "Phase IV", label: "Phase IV" },
];

export const TRIAL_PHASE_STYLES: Record<TrialPhase, string> = {
  "Phase I": "bg-purple-100 text-purple-800",
  "Phase II": "bg-indigo-100 text-indigo-800",
  "Phase III": "bg-cyan-100 text-cyan-800",
  "Phase IV": "bg-teal-100 text-teal-800",
};

// ============================================================================
// ROLES
// ============================================================================

export const TRIAL_ROLES = {
  PI: "PI",
  CRC: "CRC",
  PHYSICIAN: "Physician",
  NURSE: "Nurse",
  DATA_MANAGER: "Data Manager",
  LABORATORY: "Laboratory",
  PHARMACIST: "Pharmacist",
  MONITOR: "Monitor",
  CR: "CR",
} as const;

export const TRIAL_ROLE_OPTIONS = [
  { value: "PI", label: "Principal Investigator" },
  { value: "CRC", label: "Clinical Research Coordinator" },
  { value: "Physician", label: "Physician" },
  { value: "Nurse", label: "Nurse" },
  { value: "Data Manager", label: "Data Manager" },
  { value: "Laboratory", label: "Laboratory" },
  { value: "Pharmacist", label: "Pharmacist" },
  { value: "Monitor", label: "Monitor" },
  { value: "CR", label: "Clinical Research" },
];

// ============================================================================
// TEAM MEMBER STATUS
// ============================================================================

export const TEAM_MEMBER_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
