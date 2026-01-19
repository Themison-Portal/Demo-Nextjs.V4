/**
 * Inline Input Component
 * Always visible input with subtle styling
 * Shows outline/highlight on focus
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InlineInputProps {
  value?: string | null;
  placeholder?: string;
  onSave: (value: string) => Promise<void>;
  className?: string;
  align?: "left" | "right";
  disabled?: boolean;
}

export function InlineInput({
  value,
  placeholder = "Add...",
  onSave,
  className,
  align = "right",
  disabled = false,
}: InlineInputProps) {
  const [localValue, setLocalValue] = useState(value || "");
  const [isFocused, setIsFocused] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local state when value prop changes
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleBlur = async () => {
    setIsFocused(false);

    // Only save if value changed
    if (localValue !== (value || "")) {
      setIsSaving(true);
      try {
        await onSave(localValue);
      } catch (error) {
        console.error("Failed to save:", error);
        setLocalValue(value || "");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setLocalValue(value || "");
      inputRef.current?.blur();
    }
  };

  // Read-only display when disabled
  if (disabled) {
    return (
      <span
        className={cn(
          "text-sm px-2 py-1",
          align === "right" && "text-right",
          !value && "text-gray-400",
          className
        )}
      >
        {value || placeholder}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      disabled={isSaving}
      placeholder={placeholder}
      className={cn(
        "text-sm bg-transparent  border-transparent rounded px-2 py-1 transition-all",
        "placeholder:text-gray-400",
        "focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500",
        "hover:bg-gray-50",
        align === "right" && "text-right",
        isSaving && "opacity-100",
        className
      )}
    />
  );
}
