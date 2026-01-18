"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Minimum selectable date - dates before this will be disabled */
  minDate?: Date | null;
  /** Maximum selectable date - dates after this will be disabled */
  maxDate?: Date | null;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
  minDate,
  maxDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  // Build disabled matcher for dates outside allowed range
  const disabledDays: { before?: Date; after?: Date } | undefined =
    minDate || maxDate
      ? {
          ...(minDate && { before: minDate }),
          ...(maxDate && { after: maxDate }),
        }
      : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal h-auto py-1 px-2",
            !value && "text-gray-500",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-3 w-3" />
          {value ? format(value, "MMM d, yyyy") : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value ?? undefined}
          onSelect={handleSelect}
          disabled={disabledDays}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
