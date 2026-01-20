/**
 * VisitRow Component
 * Individual editable row for a visit in the template
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, List } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VisitTemplate } from "@/services/visits/types";
import type { ActivityType } from "@/services/activities/types";
import { ActivityModal } from "./ActivityModal";

interface VisitRowProps {
  visit: VisitTemplate;
  index: number;
  activities: ActivityType[];
  onUpdate: (visit: VisitTemplate) => void;
  onDelete: () => void;
  orgId: string;
  trialId: string;
}

export function VisitRow({
  visit,
  index,
  activities,
  onUpdate,
  onDelete,
  orgId,
  trialId,
}: VisitRowProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFieldChange = (field: keyof VisitTemplate, value: unknown) => {
    onUpdate({
      ...visit,
      [field]: value,
    });
  };

  const handleDayZeroChange = (checked: boolean) => {
    onUpdate({
      ...visit,
      is_day_zero: checked,
    });
  };

  const handleActivitiesSelected = (selectedIds: string[]) => {
    onUpdate({
      ...visit,
      activity_ids: selectedIds,
    });
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="border-0 border-gray-200 rounded-lg p-4 space-y-4 bg-white hover:border-gray-300 transition-colors">
        {/* Row Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500">
              Visit {visit.order}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`day-zero-${index}`}
                checked={visit.is_day_zero}
                onChange={(e) => handleDayZeroChange(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label
                htmlFor={`day-zero-${index}`}
                className="text-sm font-medium text-gray-700 cursor-pointer"
              >
                Baseline?
              </Label>
            </div>
          </div>
          <Button
            onClick={onDelete}
            variant="ghost"
            size="icon-sm"
            className="text-gray-400 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Main Fields */}
        <div className="grid grid-cols-12 gap-3">
          {/* Visit Name */}
          <div className="col-span-4">
            <Label
              htmlFor={`visit-name-${index}`}
              className="text-xs text-gray-600"
            >
              Name
            </Label>
            <Input
              id={`visit-name-${index}`}
              type="text"
              placeholder="e.g., Screening, Baseline"
              value={visit.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Days from Day Zero */}
          <div className="col-span-2">
            <Label htmlFor={`days-${index}`} className="text-xs text-gray-600">
              Days from Day 0
            </Label>
            <Input
              id={`days-${index}`}
              type="number"
              placeholder="0"
              value={visit.days_from_day_zero}
              onChange={(e) =>
                handleFieldChange(
                  "days_from_day_zero",
                  parseInt(e.target.value) || 0
                )
              }
              className="mt-1"
            />
          </div>

          {/* Window Before */}
          <div className="col-span-2">
            <Label
              htmlFor={`window-before-${index}`}
              className="text-xs text-gray-600"
            >
              Window (before)
            </Label>
            <Input
              id={`window-before-${index}`}
              type="number"
              placeholder="0"
              min="0"
              value={visit.window_before_days}
              onChange={(e) =>
                handleFieldChange(
                  "window_before_days",
                  parseInt(e.target.value) || 0
                )
              }
              className="mt-1"
            />
          </div>

          {/* Window After */}
          <div className="col-span-2">
            <Label
              htmlFor={`window-after-${index}`}
              className="text-xs text-gray-600"
            >
              Window (after)
            </Label>
            <Input
              id={`window-after-${index}`}
              type="number"
              placeholder="0"
              min="0"
              value={visit.window_after_days}
              onChange={(e) =>
                handleFieldChange(
                  "window_after_days",
                  parseInt(e.target.value) || 0
                )
              }
              className="mt-1"
            />
          </div>

          {/* Activities Button */}
          <div className="col-span-2">
            <Label className="text-xs text-gray-600">Activities</Label>
            <Button
              onClick={() => setIsModalOpen(true)}
              variant="outline"
              className={cn(
                "w-full mt-1 justify-start gap-2",
                visit.activity_ids.length > 0
                  ? "text-gray-900"
                  : "text-gray-500"
              )}
            >
              <List className="h-4 w-4" />
              {visit.activity_ids.length > 0
                ? `${visit.activity_ids.length} selected`
                : "Select"}
            </Button>
          </div>
        </div>

        {/* Description (optional) */}
        {visit.description !== undefined && (
          <div>
            <Label
              htmlFor={`description-${index}`}
              className="text-xs text-gray-600"
            >
              Description (optional)
            </Label>
            <Input
              id={`description-${index}`}
              type="text"
              placeholder="Visit description..."
              value={visit.description || ""}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Activity Selection Modal */}
      <ActivityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activities={activities}
        selectedIds={visit.activity_ids}
        onSave={handleActivitiesSelected}
        visitName={visit.name || `Visit ${visit.order}`}
      />
    </>
  );
}
