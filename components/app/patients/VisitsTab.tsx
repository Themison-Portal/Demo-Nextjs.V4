/**
 * Visits Tab Component
 * Displays patient's visit schedule with expandable activities
 */

"use client";

import { useState } from "react";
import { usePatientVisits } from "@/hooks/client/usePatientVisits";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/date";
import {
  VISIT_STATUS_STYLES,
  VISIT_ACTIVITY_STATUS_STYLES,
} from "@/lib/constants/visits";
import { ChevronDown, ChevronRight, Calendar, AlertCircle } from "lucide-react";
import type { VisitWithActivities } from "@/services/visits/types";

interface VisitsTabProps {
  orgId: string;
  trialId: string;
  patientId: string;
}

export function VisitsTab({ orgId, trialId, patientId }: VisitsTabProps) {
  const { visits, isLoading, error } = usePatientVisits(
    orgId,
    trialId,
    patientId
  );
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set());

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
    <div className="space-y-3">
      {visits.map((visit) => (
        <VisitCard
          key={visit.id}
          visit={visit}
          isExpanded={expandedVisits.has(visit.id)}
          onToggle={() => toggleVisit(visit.id)}
        />
      ))}
    </div>
  );
}

interface VisitCardProps {
  visit: VisitWithActivities;
  isExpanded: boolean;
  onToggle: () => void;
}

function VisitCard({ visit, isExpanded, onToggle }: VisitCardProps) {
  const statusStyle = VISIT_STATUS_STYLES[visit.status];
  const completedActivities = visit.activities.filter(
    (a) => a.status === "completed"
  ).length;
  const totalActivities = visit.activities.length;

  return (
    <Card className="p-0">
      <CardContent className="px-0">
        {/* Visit Header - Clickable to expand */}
        <button
          onClick={onToggle}
          className={`w-full  px-6 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors text-left ${
            isExpanded ? "bg-gray-200" : ""
          }`}
        >
          <div className="flex items-center gap-4 flex-1">
            {/* Expand Icon */}
            <div className="shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400" />
              )}
            </div>

            {/* Visit Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900">
                  {visit.visit_name}
                </h3>
                {visit.is_day_zero && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    Day 0
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>Scheduled: {formatDate(visit.scheduled_date)}</span>
                {visit.actual_date && (
                  <span>Actual: {formatDate(visit.actual_date)}</span>
                )}
              </div>
            </div>

            {/* Status and Progress */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">
                {completedActivities}/{totalActivities} activities
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyle}`}
              >
                {visit.status}
              </span>
            </div>
          </div>
        </button>

        {/* Visit Activities - Expandable */}
        {isExpanded && (
          <div className="px-6 pb-4 border-t border-gray-100">
            {visit.activities.length === 0 ? (
              <p className="py-4 text-sm text-gray-500 text-center">
                No activities defined for this visit
              </p>
            ) : (
              <div className="pt-3 space-y-2">
                {visit.activities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            )}

            {/* Visit Notes */}
            {visit.notes && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700">{visit.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ActivityRowProps {
  activity: VisitWithActivities["activities"][0];
}

function ActivityRow({ activity }: ActivityRowProps) {
  const statusStyle = VISIT_ACTIVITY_STATUS_STYLES[activity.status];

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50">
      <div className="flex-1">
        <p className="text-sm text-gray-900">{activity.activity_name}</p>
        {activity.notes && (
          <p className="text-xs text-gray-500 mt-0.5">{activity.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {activity.completed_at && (
          <span className="text-xs text-gray-500">
            {formatDate(activity.completed_at)}
          </span>
        )}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusStyle}`}
        >
          {activity.status}
        </span>
      </div>
    </div>
  );
}
