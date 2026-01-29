/**
 * Citation Link - Inline citation reference
 * Small clickable reference that appears inline in text like [1]
 * Opens sources panel and highlights specific source
 */

"use client";

import { cn } from "@/lib/utils";

interface CitationLinkProps {
  index: number;
  onClick: () => void;
  className?: string;
}

export function CitationLink({ index, onClick, className }: CitationLinkProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline text-xs font-medium",
        "text-gray-500 hover:text-gray-700",
        "hover:underline",
        "transition-colors cursor-pointer",
        "mx-0.5",
        className
      )}
      aria-label={`View source ${index}`}
    >
      [{index}]
    </button>
  );
}
