import type { VisitStatus, VisitActivityStatus } from "@/services/visits/types";

export const VISIT_STATUS_OPTIONS: { value: VisitStatus; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "completed", label: "Completed" },
  { value: "incompleted", label: "Incompleted" },
  { value: "suspended", label: "Suspended" },
  { value: "missed", label: "Missed" },
  { value: "cancelled", label: "Cancelled" },
];

export const VISIT_STATUS_STYLES: Record<VisitStatus, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  rescheduled: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  incompleted: "bg-orange-100 text-orange-800",
  suspended: "bg-gray-100 text-gray-800",
  missed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export const VISIT_ACTIVITY_STATUS_STYLES: Record<VisitActivityStatus, string> = {
  pending: "bg-gray-100 text-gray-600",
  completed: "bg-green-100 text-green-700",
  not_applicable: "bg-gray-50 text-gray-400",
};
