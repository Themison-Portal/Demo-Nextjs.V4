/**
 * ActivityModal Component
 * Modal for multi-selecting activities for a visit
 */

"use client";

import { useState, useMemo } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityType, ActivityCategory } from "@/services/activities/types";

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activities: ActivityType[];
  selectedIds: string[];
  onSave: (selectedIds: string[]) => void;
  visitName: string;
}

export function ActivityModal({
  isOpen,
  onClose,
  activities,
  selectedIds,
  onSave,
  visitName,
}: ActivityModalProps) {
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<ActivityCategory | "all">("all");

  // Reset local state when modal opens
  const handleOpen = () => {
    setLocalSelectedIds(selectedIds);
    setSearchTerm("");
    setFilterCategory("all");
  };

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(
      new Set(
        activities
          .map((a) => a.category)
          .filter((c): c is ActivityCategory => c !== null && c !== undefined)
      )
    ).sort();
    return cats;
  }, [activities]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesSearch = activity.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        filterCategory === "all" || activity.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [activities, searchTerm, filterCategory]);

  const toggleActivity = (activityId: string) => {
    if (localSelectedIds.includes(activityId)) {
      setLocalSelectedIds(localSelectedIds.filter((id) => id !== activityId));
    } else {
      setLocalSelectedIds([...localSelectedIds, activityId]);
    }
  };

  const handleSave = () => {
    onSave(localSelectedIds);
  };

  const handleCancel = () => {
    onClose();
  };

  // Category badge colors
  const getCategoryColor = (category: ActivityCategory | null | undefined) => {
    switch (category) {
      case "lab":
        return "bg-blue-100 text-blue-700";
      case "diagnostic":
        return "bg-purple-100 text-purple-700";
      case "nursing":
        return "bg-green-100 text-green-700";
      case "clinical":
        return "bg-orange-100 text-orange-700";
      case "admin":
        return "bg-gray-100 text-gray-700";
      case "pharmacy":
        return "bg-pink-100 text-pink-700";
      case "safety":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      className="max-w-2xl"
    >
      <ModalHeader onClose={handleCancel}>
        Select Activities - {visitName}
      </ModalHeader>

      <ModalBody className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div>
            <Label className="text-xs text-gray-600 mb-2 block">Filter by category</Label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterCategory("all")}
                className={cn(
                  "px-3 py-1 text-sm rounded-full border transition-colors",
                  filterCategory === "all"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                )}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn(
                    "px-3 py-1 text-sm rounded-full border transition-colors",
                    filterCategory === cat
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Activity List */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No activities found
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <label
                key={activity.id}
                htmlFor={`activity-${activity.id}`}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  localSelectedIds.includes(activity.id)
                    ? "bg-blue-50 border-blue-200"
                    : "bg-white border-gray-200 hover:border-gray-300"
                )}
              >
                <input
                  type="checkbox"
                  id={`activity-${activity.id}`}
                  checked={localSelectedIds.includes(activity.id)}
                  onChange={() => toggleActivity(activity.id)}
                  className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {activity.name}
                    </span>
                    {activity.category && (
                      <Badge
                        className={cn(
                          "text-xs",
                          getCategoryColor(activity.category)
                        )}
                      >
                        {activity.category}
                      </Badge>
                    )}
                  </div>
                  {activity.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {activity.description}
                    </p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        {/* Selected Count */}
        <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
          <span>
            {localSelectedIds.length} activit{localSelectedIds.length !== 1 ? "ies" : "y"} selected
          </span>
          {localSelectedIds.length > 0 && (
            <button
              onClick={() => setLocalSelectedIds([])}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear selection
            </button>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <Button onClick={handleCancel} variant="outline">
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Confirm ({localSelectedIds.length})
        </Button>
      </ModalFooter>
    </Modal>
  );
}
