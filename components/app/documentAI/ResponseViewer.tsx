/**
 * Response Viewer
 * Right column showing full question and answer
 */

"use client";

import { FileText, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { SavedResponse } from "@/types/archive";

interface ResponseViewerProps {
  response: SavedResponse | null;
}

export function ResponseViewer({ response }: ResponseViewerProps) {
  if (!response) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 space-y-2 px-4">
          <FileText className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-sm">Select a response to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {response.title}
          </h2>
          <p className="text-xs text-gray-500">
            Saved {formatDistanceToNow(new Date(response.created_at), { addSuffix: true })}
          </p>
        </div>

        {/* Question Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">Q</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Question
            </h3>
          </div>
          <div className="pl-8">
            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
              {response.question}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Answer Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Answer
            </h3>
          </div>
          <div className="pl-8">
            <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
              {response.answer}
            </p>
          </div>
        </div>

        {/* Raw Data Preview (if exists) */}
        {response.raw_data && (
          <>
            <div className="border-t border-gray-200" />
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Additional Data
              </h3>
              <details className="pl-2">
                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                  View raw data (JSON)
                </summary>
                <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-auto max-h-96">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                    {JSON.stringify(response.raw_data, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
