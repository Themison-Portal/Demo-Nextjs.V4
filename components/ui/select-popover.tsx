/**
 * Select Popover Component
 * Modern dropdown select using Radix Popover
 */

"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Option {
  value: string;
  label: string;
}

interface SelectPopoverProps {
  value?: string | null;
  options: Option[];
  placeholder?: string;
  onSelect: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function SelectPopover({
  value,
  options,
  placeholder = "Select...",
  onSelect,
  disabled = false,
  className,
}: SelectPopoverProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || placeholder;

  const handleSelect = (optionValue: string) => {
    onSelect(optionValue);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center gap-1 text-sm rounded px-2 py-1 transition-colors",
            "hover:bg-gray-100 disabled:opacity-50",
            !value && "text-gray-500",
            className
          )}
        >
          <span>{displayLabel}</span>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className=" min-w-40 w-auto p-1" align="end">
        {options.map((option) => {
          const isSelected = option.value === value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option.value)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm rounded transition-colors",
                "hover:bg-gray-100",
                isSelected && "bg-gray-50"
              )}
            >
              <span>{option.label}</span>
              {isSelected && <Check className="h-4 w-4 text-blue-600" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
