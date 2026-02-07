/**
 * Task Card Skeleton
 * Placeholder shown while tasks are loading
 */

"use client";

export function TaskCardSkeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 animate-pulse">
      {/* Title skeleton */}
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />

      {/* Badges skeleton */}
      <div className="flex gap-1.5 mb-2">
        <div className="h-5 bg-gray-200 rounded w-16" />
        <div className="h-5 bg-gray-200 rounded w-20" />
      </div>

      {/* Patient/Visit links skeleton */}
      <div className="h-3 bg-gray-200 rounded w-32 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-24 mb-2" />

      {/* Due date skeleton */}
      <div className="h-3 bg-gray-200 rounded w-28 mb-2" />

      {/* Assignee skeleton */}
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="h-8 bg-gray-200 rounded w-full" />
      </div>
    </div>
  );
}
