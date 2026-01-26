/**
 * Empty State - AI Assistant
 * Shown when no document is selected
 */

"use client";

import { Button } from "@/components/ui/button";
import { FileSearch, Sparkles } from "lucide-react";

interface EmptyStateProps {
  onSelectDocument: () => void;
}

export function EmptyState({ onSelectDocument }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-250px)] bg-white rounded-xl border border-gray-200">
      <div className="text-center max-w-md space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center">
              <FileSearch className="w-10 h-10 text-blue-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900">
            Select a Document to Start
          </h2>
          <p className="text-gray-600">
            Choose a trial and document to ask questions using AI. Get instant
            answers about eligibility criteria, medical tests, visit schedules, and
            more.
          </p>
        </div>

        {/* Action */}
        <Button
          onClick={onSelectDocument}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <FileSearch className="w-4 h-4 mr-2" />
          Select Document
        </Button>

        {/* Example queries */}
        <div className="pt-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Example queries
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              "Inclusion criteria for male patients",
              "Required medical test checklist",
              "Schedule of activities",
            ].map((query) => (
              <div
                key={query}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                {query}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
