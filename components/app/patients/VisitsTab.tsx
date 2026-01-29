/**
 * Visits Tab Component
 * Displays patient's visit schedule with timeline visualization
 */

"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePatientVisits } from "@/hooks/client/usePatientVisits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/date";
import {
  VISIT_STATUS_STYLES,
  VISIT_ACTIVITY_STATUS_STYLES,
} from "@/lib/constants/visits";
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  AlertCircle,
  CheckCircle,
  Check,
  Circle as CircleIcon,
  Clock,
} from "lucide-react";
import type { VisitWithActivities } from "@/services/visits/types";

interface VisitsTabProps {
  orgId: string;
  trialId: string;
  patientId: string;
}

export function VisitsTab({ orgId, trialId, patientId }: VisitsTabProps) {
  const searchParams = useSearchParams();
  const { visits, isLoading, error, completeVisit, isCompletingVisit } =
    usePatientVisits(orgId, trialId, patientId);
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());
  const [visitToComplete, setVisitToComplete] = useState<string | null>(null);

  // Auto-expand visit from URL query param
  useEffect(() => {
    const visitId = searchParams.get("visitId");
    if (visitId && visits.length > 0) {
      setExpandedVisits((prev) => {
        const next = new Set(prev);
        next.add(visitId);
        return next;
      });
    }
  }, [searchParams, visits]);

  const toggleVisit = (visitId: string) => {
    setExpandedVisits((prev) => {
      const next = new Set(prev);
      if (next.has(visitId)) {
        next.delete(visitId);
      } else {
        next.add(visitId);
      }
      return next;
    });
  };

  const handleCompleteVisit = async () => {
    if (!visitToComplete) return;
    try {
      await completeVisit(visitToComplete);
      setVisitToComplete(null);
    } catch (error) {
      console.error("Error completing visit:", error);
      // Error handling is done by the hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Loading visits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <div className="text-red-500">
          {error.message || "Failed to load visits"}
        </div>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No visits scheduled
          </h3>
          <p className="text-sm text-gray-500">
            Visits will appear here after patient enrollment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="px-6 py-6">
          {/* Timeline Container */}
          <div className="relative">
            {/* Timeline vertical line */}
            <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-gray-200" />

            {/* Visits */}
            <div className="space-y-0">
              {visits.map((visit, idx) => (
                <VisitTimelineItem
                  key={visit.id}
                  visit={visit}
                  isExpanded={expandedVisits.has(visit.id)}
                  onToggle={() => toggleVisit(visit.id)}
                  onCompleteVisit={() => setVisitToComplete(visit.id)}
                  isLast={idx === visits.length - 1}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Visit Dialog */}
      <AlertDialog
        open={!!visitToComplete}
        onOpenChange={(open) => !open && setVisitToComplete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Visit?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark this visit as completed. This action cannot be undone. All
              activities must be completed or marked as not applicable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCompleteVisit}
              disabled={isCompletingVisit}
            >
              {isCompletingVisit ? "Completing..." : "Complete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface VisitTimelineItemProps {
  visit: VisitWithActivities;
  isExpanded: boolean;
  onToggle: () => void;
  onCompleteVisit: () => void;
  isLast: boolean;
}

function VisitTimelineItem({
  visit,
  isExpanded,
  onToggle,
  onCompleteVisit,
  isLast,
}: VisitTimelineItemProps) {
  const completedActivities = visit.activities.filter(
    (a) => a.status === "completed"
  ).length;
  const totalActivities = visit.activities.length;
  const completionRate = totalActivities > 0
    ? Math.round((completedActivities / totalActivities) * 100)
    : 0;

  // Check if all activities are done (completed or not_applicable)
  const allActivitiesDone = visit.activities.every(
    (a) => a.status === "completed" || a.status === "not_applicable"
  );
  const canCompleteVisit =
    allActivitiesDone && visit.status !== "completed" && totalActivities > 0;

  // Status color mapping
  const statusColors = {
    completed: "bg-green-500",
    scheduled: "bg-blue-500",
    rescheduled: "bg-yellow-500",
    incompleted: "bg-orange-500",
    suspended: "bg-gray-400",
    missed: "bg-red-500",
    cancelled: "bg-gray-300",
  };

  const statusColor = statusColors[visit.status] || "bg-gray-400";

  // Check if there's a date discrepancy
  const hasDateDiscrepancy = visit.actual_date && visit.actual_date !== visit.scheduled_date;

  return (
    <div className={`relative flex gap-6 ${!isLast ? "pb-8" : "pb-2"}`}>
      {/* Timeline node */}
      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
        {visit.status === "completed" ? (
          <div className={`flex h-5 w-5 items-center justify-center rounded-full ${statusColor} ring-4 ring-white`}>
            <Check className="h-3 w-3 text-white" />
          </div>
        ) : (
          <div className={`h-3 w-3 rounded-full ${statusColor} ring-4 ring-white`} />
        )}
      </div>

      {/* Visit content */}
      <div className="flex-1 -mt-1">
        <button
          onClick={onToggle}
          className="w-full text-left group"
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base font-semibold text-gray-900 group-hover:text-gray-700">
                  {visit.visit_name}
                </h3>
                {visit.is_day_zero && (
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    Day 0
                  </span>
                )}
                <span
                  className={`text-xs px-2 py-0.5 rounded capitalize ${
                    visit.status === "completed"
                      ? "bg-green-50 text-green-700"
                      : visit.status === "scheduled" || visit.status === "rescheduled"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {visit.status}
                </span>
              </div>

              {/* Date info */}
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(visit.scheduled_date)}
                </span>
                {hasDateDiscrepancy && (
                  <span className="flex items-center gap-1.5 text-orange-600">
                    <Clock className="h-3.5 w-3.5" />
                    Actual: {formatDate(visit.actual_date!)}
                  </span>
                )}
              </div>
            </div>

            {/* Expand icon */}
            <div className="shrink-0 pt-1">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>

          {/* Progress bar */}
          {totalActivities > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {completedActivities} of {totalActivities} activities completed
                </span>
                <span className="text-gray-500 font-medium">
                  {completionRate}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    visit.status === "completed"
                      ? "bg-green-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>
          )}
        </button>

        {/* Expanded activities */}
        {isExpanded && (
          <div className="mt-4 space-y-3">
            {visit.activities.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">
                No activities defined for this visit
              </p>
            ) : (
              <div className="space-y-1">
                {visit.activities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            )}

            {/* Visit Notes */}
            {visit.notes && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 uppercase mb-1.5">
                  Notes
                </p>
                <p className="text-sm text-gray-700">{visit.notes}</p>
              </div>
            )}

            {/* Complete Visit Button */}
            {canCompleteVisit && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteVisit();
                  }}
                  size="sm"
                  className="w-full"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Visit
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ActivityRowProps {
  activity: VisitWithActivities["activities"][0];
}

function ActivityRow({ activity }: ActivityRowProps) {
  const isCompleted = activity.status === "completed";
  const isNotApplicable = activity.status === "not_applicable";

  return (
    <div className="flex items-start gap-3 py-2.5 px-3 rounded-md hover:bg-gray-50 transition-colors group">
      {/* Status icon */}
      <div className="shrink-0 pt-0.5">
        {isCompleted ? (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-green-100">
            <Check className="h-3 w-3 text-green-600" />
          </div>
        ) : isNotApplicable ? (
          <div className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100">
            <span className="text-xs text-gray-500">—</span>
          </div>
        ) : (
          <CircleIcon className="h-4 w-4 text-gray-300" />
        )}
      </div>

      {/* Activity info */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isCompleted ? "text-gray-700" : "text-gray-900"}`}>
          {activity.activity_name}
        </p>
        {activity.notes && (
          <p className="text-xs text-gray-500 mt-0.5">{activity.notes}</p>
        )}
        {activity.completed_at && (
          <p className="text-xs text-gray-500 mt-0.5">
            Completed {formatDate(activity.completed_at)}
          </p>
        )}
      </div>

      {/* Status badge - only show if not completed */}
      {!isCompleted && (
        <span
          className={`text-xs px-2 py-0.5 rounded shrink-0 ${
            isNotApplicable
              ? "bg-gray-100 text-gray-600"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {activity.status === "not_applicable" ? "N/A" : "pending"}
        </span>
      )}
    </div>
  );
}
