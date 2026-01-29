/**
 * Mock visit templates for AI extraction simulation
 * Simulates RAG analyzing protocol documents and returning visit schedules
 * Matches trial name to appropriate protocol template
 */

import type { VisitScheduleTemplate } from "@/services/visits/types";

export const MOCK_PROTOCOLS: Record<string, VisitScheduleTemplate> = {
  diabetes: {
    version: 2,
    visits: [
      {
        name: "Screening (V1)",
        order: 1,
        is_day_zero: false,
        activity_ids: ["consent", "vitals", "blood_draw", "urine_sample"],
        window_after_days: 0,
        days_from_day_zero: -28,
        window_before_days: 0,
      },
      {
        name: "Lead-in (V2)",
        order: 2,
        is_day_zero: true,
        activity_ids: ["vitals", "physical_exam", "blood_draw"],
        window_after_days: 0,
        days_from_day_zero: 0,
        window_before_days: 0,
      },
      {
        name: "Week 4 (V4)",
        order: 3,
        is_day_zero: false,
        activity_ids: ["vitals", "ecg", "drug_dispensing"],
        window_after_days: 3,
        days_from_day_zero: 28,
        window_before_days: 3,
      },
      {
        name: "Week 12 (V6)",
        order: 4,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw", "drug_dispensing", "questionnaire"],
        window_after_days: 3,
        days_from_day_zero: 84,
        window_before_days: 3,
      },
      {
        name: "Week 24 (V8)",
        order: 5,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw", "drug_dispensing"],
        window_after_days: 5,
        days_from_day_zero: 168,
        window_before_days: 5,
      },
      {
        name: "Week 52 (V12)",
        order: 6,
        is_day_zero: false,
        activity_ids: ["physical_exam", "vitals", "ecg", "blood_draw"],
        window_after_days: 7,
        days_from_day_zero: 364,
        window_before_days: 7,
      },
      {
        name: "Final Visit (V13)",
        order: 7,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw", "adverse_event"],
        window_after_days: 7,
        days_from_day_zero: 378,
        window_before_days: 7,
      },
      {
        name: "Follow-up (V801)",
        order: 8,
        is_day_zero: false,
        activity_ids: ["vitals", "urine_sample"],
        window_after_days: 0,
        days_from_day_zero: 406,
        window_before_days: 0,
      },
    ],
    assignees: {
      consent: "PI",
      vitals: "Nurse",
      physical_exam: "Physician",
      blood_draw: "Laboratory",
      ecg: "Nurse",
      drug_dispensing: "Pharmacist",
      questionnaire: "CRC",
      adverse_event: "CRC",
      urine_sample: "Laboratory",
      xray: "Laboratory",
    },
  },

  oncology: {
    version: 2,
    visits: [
      {
        name: "Screening",
        order: 1,
        is_day_zero: false,
        activity_ids: ["consent", "physical_exam", "vitals", "ecg", "blood_draw", "xray"],
        window_after_days: 0,
        days_from_day_zero: -14,
        window_before_days: 0,
      },
      {
        name: "Cycle 1 Day 1",
        order: 2,
        is_day_zero: true,
        activity_ids: ["vitals", "blood_draw", "drug_dispensing", "adverse_event"],
        window_after_days: 0,
        days_from_day_zero: 0,
        window_before_days: 0,
      },
      {
        name: "Cycle 1 Day 8",
        order: 3,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw", "adverse_event"],
        window_after_days: 2,
        days_from_day_zero: 7,
        window_before_days: 2,
      },
      {
        name: "Cycle 1 Day 15",
        order: 4,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw", "drug_dispensing"],
        window_after_days: 2,
        days_from_day_zero: 14,
        window_before_days: 2,
      },
      {
        name: "Cycle 1 Day 22",
        order: 5,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw"],
        window_after_days: 2,
        days_from_day_zero: 21,
        window_before_days: 2,
      },
      {
        name: "Cycle 2 Day 1",
        order: 6,
        is_day_zero: false,
        activity_ids: ["physical_exam", "vitals", "blood_draw", "drug_dispensing"],
        window_after_days: 2,
        days_from_day_zero: 28,
        window_before_days: 2,
      },
      {
        name: "Cycle 2 Day 15",
        order: 7,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw", "drug_dispensing"],
        window_after_days: 2,
        days_from_day_zero: 42,
        window_before_days: 2,
      },
      {
        name: "End of Treatment (EOT)",
        order: 8,
        is_day_zero: false,
        activity_ids: ["physical_exam", "vitals", "ecg", "blood_draw", "urine_sample"],
        window_after_days: 10,
        days_from_day_zero: 56,
        window_before_days: 0,
      },
      {
        name: "Follow-up (1M FUP)",
        order: 9,
        is_day_zero: false,
        activity_ids: ["vitals", "adverse_event"],
        window_after_days: 7,
        days_from_day_zero: 84,
        window_before_days: 7,
      },
    ],
    assignees: {
      consent: "PI",
      physical_exam: "Physician",
      vitals: "Nurse",
      ecg: "Nurse",
      blood_draw: "Laboratory",
      drug_dispensing: "Nurse",
      adverse_event: "Physician",
      urine_sample: "Laboratory",
      xray: "Laboratory",
      questionnaire: "CRC",
    },
  },

  colitis: {
    version: 2,
    visits: [
      {
        name: "Stabilization (V0)",
        order: 1,
        is_day_zero: false,
        activity_ids: ["consent", "questionnaire", "vitals"],
        window_after_days: 0,
        days_from_day_zero: -28,
        window_before_days: 0,
      },
      {
        name: "Screening (V1)",
        order: 2,
        is_day_zero: false,
        activity_ids: ["physical_exam", "vitals", "ecg", "blood_draw"],
        window_after_days: 0,
        days_from_day_zero: -5,
        window_before_days: 0,
      },
      {
        name: "Baseline (V2)",
        order: 3,
        is_day_zero: true,
        activity_ids: ["vitals", "ecg", "blood_draw", "drug_dispensing"],
        window_after_days: 0,
        days_from_day_zero: 0,
        window_before_days: 0,
      },
      {
        name: "Visit 2.1",
        order: 4,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw"],
        window_after_days: 0,
        days_from_day_zero: 2,
        window_before_days: 0,
      },
      {
        name: "Visit 2.2",
        order: 5,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw"],
        window_after_days: 0,
        days_from_day_zero: 6,
        window_before_days: 0,
      },
      {
        name: "Visit 2.3",
        order: 6,
        is_day_zero: false,
        activity_ids: ["vitals", "blood_draw"],
        window_after_days: 0,
        days_from_day_zero: 10,
        window_before_days: 0,
      },
      {
        name: "Visit 3 (Week 2)",
        order: 7,
        is_day_zero: false,
        activity_ids: ["vitals", "ecg", "blood_draw", "drug_dispensing"],
        window_after_days: 1,
        days_from_day_zero: 14,
        window_before_days: 1,
      },
      {
        name: "Visit 4 (Week 4)",
        order: 8,
        is_day_zero: false,
        activity_ids: ["vitals", "ecg", "blood_draw", "drug_dispensing"],
        window_after_days: 1,
        days_from_day_zero: 28,
        window_before_days: 1,
      },
      {
        name: "Visit 5 (Week 6)",
        order: 9,
        is_day_zero: false,
        activity_ids: ["vitals", "ecg", "blood_draw", "drug_dispensing"],
        window_after_days: 1,
        days_from_day_zero: 42,
        window_before_days: 1,
      },
      {
        name: "Visit 6 (Week 8)",
        order: 10,
        is_day_zero: false,
        activity_ids: ["vitals", "ecg", "blood_draw", "drug_dispensing"],
        window_after_days: 1,
        days_from_day_zero: 56,
        window_before_days: 1,
      },
      {
        name: "Visit 7 (Week 10)",
        order: 11,
        is_day_zero: false,
        activity_ids: ["vitals", "ecg", "blood_draw", "drug_dispensing"],
        window_after_days: 2,
        days_from_day_zero: 70,
        window_before_days: 2,
      },
      {
        name: "Visit 8 (End of Treatment)",
        order: 12,
        is_day_zero: false,
        activity_ids: ["physical_exam", "vitals", "ecg", "blood_draw", "urine_sample"],
        window_after_days: 2,
        days_from_day_zero: 84,
        window_before_days: 2,
      },
      {
        name: "Safety Follow-up (V9)",
        order: 13,
        is_day_zero: false,
        activity_ids: ["physical_exam", "vitals", "adverse_event"],
        window_after_days: 2,
        days_from_day_zero: 105,
        window_before_days: 2,
      },
    ],
    assignees: {
      consent: "PI",
      vitals: "Nurse",
      physical_exam: "Physician",
      ecg: "Nurse",
      blood_draw: "Laboratory",
      drug_dispensing: "Nurse",
      adverse_event: "CRC",
      urine_sample: "Laboratory",
      xray: "Laboratory",
      questionnaire: "CRC",
    },
  },
};

/**
 * Matches trial name to appropriate protocol template
 * @param trialName - Name of the trial to match
 * @returns The matched protocol key
 */
function matchProtocolByTrialName(trialName: string): string {
  const nameLower = trialName.toLowerCase();

  if (nameLower.includes("diabetes") || nameLower.includes("diabetic")) {
    return "diabetes";
  }

  if (
    nameLower.includes("oncolog") ||
    nameLower.includes("cancer") ||
    nameLower.includes("tumor")
  ) {
    return "oncology";
  }

  if (
    nameLower.includes("colitis") ||
    nameLower.includes("crohn") ||
    nameLower.includes("ibd")
  ) {
    return "colitis";
  }

  // Default fallback - return oncology
  return "diabetes";
}

/**
 * Simulates RAG extraction delay and returns appropriate template
 * @param trialName - Name of the current trial
 */
export async function simulateAIExtraction(
  trialName: string,
): Promise<VisitScheduleTemplate> {
  // Simulate network delay (RAG processing)
  await new Promise((resolve) => setTimeout(resolve, 2500));

  // Match trial name to protocol
  const protocolKey = matchProtocolByTrialName(trialName);

  return MOCK_PROTOCOLS[protocolKey];
}
