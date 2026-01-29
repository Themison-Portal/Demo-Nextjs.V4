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
      <div className="grid grid-cols-[auto_2fr_1fr_1fr_1fr_1.5fr_auto] border-b border-gray-100 hover:bg-gray-50 transition-colors group">
        {/* Baseline Checkbox */}
        <div className="flex items-center justify-center px-4">
          <input
            type="checkbox"
            id={`day-zero-${index}`}
            checked={visit.is_day_zero}
            onChange={(e) => handleDayZeroChange(e.target.checked)}
            className="h-4 w-4 text-gray-900 border-gray-300 rounded focus:ring-1 focus:ring-gray-400"
          />
        </div>

        {/* Visit Name */}
        <Input
          id={`visit-name-${index}`}
          type="text"
          placeholder={`Visit ${visit.order}`}
          value={visit.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          className="h-full w-full text-sm border-0 rounded-none bg-transparent px-4 py-3 focus:outline-none focus:ring-0 shadow-none"
        />

        {/* Days from Day Zero */}
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
          className="h-full w-full text-sm border-0 rounded-none bg-transparent px-4 py-3 focus:outline-none focus:ring-0 shadow-none"
        />

        {/* Window Before */}
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
          className="h-full w-full text-sm border-0 rounded-none bg-transparent px-4 py-3 focus:outline-none focus:ring-0 shadow-none"
        />

        {/* Window After */}
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
          className="h-full w-full text-sm border-0 rounded-none bg-transparent px-4 py-3 focus:outline-none focus:ring-0 shadow-none"
        />

        {/* Activities Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            "h-full w-full text-sm text-left px-4 py-3 transition-colors flex items-center gap-1.5",
            visit.activity_ids.length > 0
              ? "text-gray-900"
              : "text-gray-400"
          )}
        >
          <List className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="truncate">
            {visit.activity_ids.length > 0
              ? `${visit.activity_ids.length} selected`
              : "Select"}
          </span>
        </button>

        {/* Delete Button */}
        <div className="flex items-center justify-center w-12">
          <Button
            onClick={onDelete}
            variant="ghost"
            size="icon-sm"
            className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
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
