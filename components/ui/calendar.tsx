"use client";

import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Generate years range (current year - 10 to current year + 10)
function getYearsRange(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let i = currentYear - 10; i <= currentYear + 10; i++) {
    years.push(i);
  }
  return years;
}

interface MonthSelectProps {
  month: number;
  onChange: (month: number) => void;
}

function MonthSelect({ month, onChange }: MonthSelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors"
      >
        {MONTHS[month]}
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-[200px] overflow-y-auto">
          {MONTHS.map((name, idx) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                onChange(idx);
                setOpen(false);
              }}
              className={cn(
                "block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors",
                idx === month && "bg-gray-100 font-medium"
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface YearSelectProps {
  year: number;
  onChange: (year: number) => void;
}

function YearSelect({ year, onChange }: YearSelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);
  const years = React.useMemo(() => getYearsRange(), []);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll to current year when opened
  React.useEffect(() => {
    if (open && listRef.current) {
      const yearIndex = years.indexOf(year);
      if (yearIndex !== -1) {
        const itemHeight = 32; // approximate height of each item
        listRef.current.scrollTop = Math.max(0, (yearIndex - 2) * itemHeight);
      }
    }
  }, [open, year, years]);

  const scrollUp = () => {
    if (listRef.current) {
      listRef.current.scrollTop -= 96; // 3 items
    }
  };

  const scrollDown = () => {
    if (listRef.current) {
      listRef.current.scrollTop += 96; // 3 items
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-sm font-medium hover:bg-gray-100 px-2 py-1 rounded transition-colors"
      >
        {year}
      </button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 w-20">
          <button
            type="button"
            onClick={scrollUp}
            className="w-full flex items-center justify-center py-1 hover:bg-gray-100 border-b border-gray-100"
          >
            <ChevronUp className="h-4 w-4 text-gray-500" />
          </button>
          <div
            ref={listRef}
            className="max-h-[160px] overflow-y-auto scroll-smooth"
            style={{ scrollbarWidth: "thin" }}
          >
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => {
                  onChange(y);
                  setOpen(false);
                }}
                className={cn(
                  "block w-full text-center px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors",
                  y === year && "bg-gray-100 font-medium"
                )}
              >
                {y}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={scrollDown}
            className="w-full flex items-center justify-center py-1 hover:bg-gray-100 border-t border-gray-100"
          >
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      )}
    </div>
  );
}

interface CustomCaptionProps {
  month: Date;
  onMonthChange: (date: Date) => void;
}

function CustomCaption({ month, onMonthChange }: CustomCaptionProps) {
  const handlePrevMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(newDate.getMonth() + 1);
    onMonthChange(newDate);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const newDate = new Date(month);
    newDate.setMonth(monthIndex);
    onMonthChange(newDate);
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(month);
    newDate.setFullYear(year);
    onMonthChange(newDate);
  };

  return (
    <div className="flex items-center justify-center gap-1 py-2">
      <button
        type="button"
        onClick={handlePrevMonth}
        className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-blue-50 transition-colors"
      >
        <ChevronLeft className="h-4 w-4 text-blue-600" />
      </button>
      <div className="flex items-center gap-1">
        <MonthSelect month={month.getMonth()} onChange={handleMonthSelect} />
        <YearSelect year={month.getFullYear()} onChange={handleYearSelect} />
      </div>
      <button
        type="button"
        onClick={handleNextMonth}
        className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-blue-50 transition-colors"
      >
        <ChevronRight className="h-4 w-4 text-blue-600" />
      </button>
    </div>
  );
}

function Calendar({ className, classNames, ...props }: CalendarProps) {
  const [month, setMonth] = React.useState<Date>(
    props.defaultMonth || props.selected as Date || new Date()
  );

  return (
    <div className={cn("p-3", className)}>
      <CustomCaption month={month} onMonthChange={setMonth} />
      <DayPicker
        month={month}
        onMonthChange={setMonth}
        hideNavigation
        classNames={{
          months: "flex flex-col",
          month: "",
          month_caption: "hidden",
          month_grid: "w-full border-collapse",
          weekdays: "flex",
          weekday: "text-gray-500 w-9 font-normal text-[0.8rem] text-center",
          week: "flex w-full mt-1",
          day: "relative p-0 text-center text-sm h-9 w-9",
          day_button: cn(
            "h-9 w-9 p-0 font-normal",
            "inline-flex items-center justify-center rounded-md text-sm",
            "transition-colors hover:bg-gray-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400",
            "disabled:pointer-events-none disabled:opacity-50"
          ),
          selected:
            "bg-gray-900 text-white hover:bg-gray-900 hover:text-white rounded-md",
          today: "bg-gray-100 text-gray-900 rounded-md",
          outside: "text-gray-400 opacity-50",
          disabled: "text-gray-400 opacity-50",
          hidden: "invisible",
          ...classNames,
        }}
        {...props}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
