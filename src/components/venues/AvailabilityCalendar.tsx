"use client";

import { useMemo } from "react";
import { DayPicker } from "react-day-picker";
import type { MonthAvailabilityDay } from "@/features/venues/types";
import { cn } from "@/lib/utils";
import "react-day-picker/style.css";

type AvailabilityCalendarProps = {
  month: Date;
  onMonthChange: (month: Date) => void;
  availability: MonthAvailabilityDay[];
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabledBefore?: Date;
  className?: string;
};

export function AvailabilityCalendar({
  month,
  onMonthChange,
  availability,
  selected,
  onSelect,
  disabledBefore = new Date(),
  className,
}: AvailabilityCalendarProps) {
  const availabilityMap = useMemo(() => {
    const map = new Map<string, MonthAvailabilityDay>();
    for (const day of availability) {
      map.set(day.date, day);
    }
    return map;
  }, [availability]);

  const disabledDays = useMemo(() => {
    return (date: Date) => {
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const entry = availabilityMap.get(key);
      if (date < new Date(disabledBefore.getFullYear(), disabledBefore.getMonth(), disabledBefore.getDate())) {
        return true;
      }
      return entry ? !entry.available : false;
    };
  }, [availabilityMap, disabledBefore]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 [&_.rdp-root]:text-white [&_.rdp-day_button]:text-white [&_.rdp-disabled]:opacity-30 [&_.rdp-selected]:bg-primary [&_.rdp-selected]:text-white",
        className,
      )}
    >
      <DayPicker
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        selected={selected}
        onSelect={onSelect}
        disabled={disabledDays}
        showOutsideDays
      />
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-primary" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Unavailable
        </span>
      </div>
    </div>
  );
}
