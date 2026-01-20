/**
 * TemplateBuilder Component
 * Main form for creating/editing visit schedule templates
 * Features:
 * - Tab 1: Visit Schedule (visits, days, windows, activities)
 * - Tab 2: Activity Assignees (assign roles to activities)
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useVisitTemplate } from "@/hooks/client/useVisitTemplate";
import { useActivityTypes } from "@/hooks/client/useActivityTypes";
import { CalendarDays, Users, Save, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  VisitScheduleTemplate,
  VisitTemplate,
} from "@/services/visits/types";
import { VisitRow } from "./VisitRow";
import { AssigneeTab } from "./AssigneeTab";

type TabValue = "schedule" | "assignees";

interface TemplateBuilderProps {
  orgId: string;
  trialId: string;
}

export function TemplateBuilder({ orgId, trialId }: TemplateBuilderProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("schedule");
  const [visits, setVisits] = useState<VisitTemplate[]>([]);
  const [assignees, setAssignees] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { template, isLoading, updateTemplate, isUpdating } = useVisitTemplate(
    orgId,
    trialId
  );
  const { activities } = useActivityTypes(orgId, trialId);

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setVisits(template.visits || []);
      setAssignees(template.assignees || {});
      setHasChanges(false);
    } else {
      // Initialize with empty state
      setVisits([]);
      setAssignees({});
    }
  }, [template]);

  const handleAddVisit = () => {
    const newOrder = visits.length + 1;
    const newVisit: VisitTemplate = {
      name: "",
      order: newOrder,
      days_from_day_zero: 0,
      is_day_zero: visits.length === 0, // First visit is day zero by default
      window_before_days: 0,
      window_after_days: 0,
      activity_ids: [],
    };
    setVisits([...visits, newVisit]);
    setHasChanges(true);
  };

  const handleUpdateVisit = (index: number, updatedVisit: VisitTemplate) => {
    const newVisits = [...visits];
    newVisits[index] = updatedVisit;

    // If this visit was set to day_zero, unset others
    if (updatedVisit.is_day_zero) {
      newVisits.forEach((v, i) => {
        if (i !== index) {
          v.is_day_zero = false;
        }
      });
    }

    setVisits(newVisits);
    setHasChanges(true);
  };

  const handleDeleteVisit = (index: number) => {
    const newVisits = visits.filter((_, i) => i !== index);
    // Reorder
    newVisits.forEach((v, i) => {
      v.order = i + 1;
    });

    // If we deleted the day_zero visit, make the first one day_zero
    const hasDayZero = newVisits.some((v) => v.is_day_zero);
    if (!hasDayZero && newVisits.length > 0) {
      newVisits[0].is_day_zero = true;
    }

    setVisits(newVisits);
    setHasChanges(true);
  };

  const handleUpdateAssignees = (newAssignees: Record<string, string>) => {
    setAssignees(newAssignees);
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validation
    if (visits.length === 0) {
      alert("Must add at least one visit");
      return;
    }

    const dayZeroCount = visits.filter((v) => v.is_day_zero).length;
    if (dayZeroCount !== 1) {
      alert("Must mark exactly one visit as Day 0");
      return;
    }

    const emptyNames = visits.some((v) => !v.name.trim());
    if (emptyNames) {
      alert("All visit names are required");
      return;
    }

    const duplicateNames =
      new Set(visits.map((v) => v.name)).size !== visits.length;
    if (duplicateNames) {
      alert("Visit names must be unique");
      return;
    }

    // Build template
    const newTemplate: VisitScheduleTemplate = {
      version: template?.version ? template.version + 1 : 1,
      visits,
      assignees,
    };

    try {
      await updateTemplate(newTemplate);
      setHasChanges(false);
      alert("Template saved successfully");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert("Error saving template: " + errorMessage);
    }
  };

  // Get all unique activity IDs from visits
  const allActivityIds = Array.from(
    new Set(visits.flatMap((v) => v.activity_ids))
  );

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <Spinner className="mx-auto mb-4" />
        <p className="text-gray-500">Loading template...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Visit Schedule Template
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure trial visits and activities
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating}
          className="gap-2 text-md"
        >
          {isUpdating ? (
            <>
              <Spinner className="h-4 w-4" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Template
            </>
          )}
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("schedule")}
            className={cn(
              "flex items-center gap-2 px-2 py-3 border-b font-medium transition-colors text-sm",
              activeTab === "schedule"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Visit Schedule
          </button>
          <button
            onClick={() => setActiveTab("assignees")}
            className={cn(
              "flex items-center gap-2 px-2 py-3 border-b font-medium transition-colors text-sm",
              activeTab === "assignees"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            )}
          >
            <Users className="h-4 w-4" />
            Activity Assignees
            {allActivityIds.length > 0 && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {allActivityIds.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <Card className="p-6 border-0">
        {activeTab === "schedule" ? (
          <div className="space-y-4">
            {visits.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No visits configured</p>
                <Button onClick={handleAddVisit} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Visit
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {visits.map((visit, index) => (
                    <VisitRow
                      key={index}
                      visit={visit}
                      index={index}
                      activities={activities}
                      onUpdate={(updated) => handleUpdateVisit(index, updated)}
                      onDelete={() => handleDeleteVisit(index)}
                      orgId={orgId}
                      trialId={trialId}
                    />
                  ))}
                </div>
                <Button
                  onClick={handleAddVisit}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Another Visit
                </Button>
              </>
            )}
          </div>
        ) : (
          <AssigneeTab
            activityIds={allActivityIds}
            activities={activities}
            assignees={assignees}
            onUpdateAssignees={handleUpdateAssignees}
          />
        )}
      </Card>
    </div>
  );
}
