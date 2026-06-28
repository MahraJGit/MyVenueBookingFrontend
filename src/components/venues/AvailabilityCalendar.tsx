"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import type { MonthAvailabilityDay } from "@/features/venues/types";
import { cn } from "@/lib/utils";

type AvailabilityCalendarProps = {
  month: Date;
  onMonthChange: (month: Date) => void;
  availability: MonthAvailabilityDay[];
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabledBefore?: Date;
  className?: string;
};

function formatDateKeyLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function VenueDayButton({
  className,
  ...props
}: React.ComponentProps<typeof CalendarDayButton>) {
  return (
    <CalendarDayButton
      className={cn(
        "min-w-0 max-w-full text-sm text-zinc-200 hover:bg-primary/15 hover:text-white dark:hover:bg-primary/15 dark:hover:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function AvailabilityCalendar({
  month,
  onMonthChange,
  availability,
  selected,
  onSelect,
  disabledBefore = new Date(),
  className,
}: AvailabilityCalendarProps) {
  const t = useTranslations("venues");
  const today = useMemo(() => startOfDay(disabledBefore), [disabledBefore]);

  const availabilityMap = useMemo(() => {
    const map = new Map<string, MonthAvailabilityDay>();
    for (const day of availability) {
      map.set(day.date, day);
    }
    return map;
  }, [availability]);

  const isPast = useMemo(() => {
    return (date: Date) => startOfDay(date) < today;
  }, [today]);

  const isUnavailable = useMemo(() => {
    return (date: Date) => {
      const entry = availabilityMap.get(formatDateKeyLocal(date));
      return entry ? !entry.available : false;
    };
  }, [availabilityMap]);

  const disabledDays = useMemo(() => {
    return (date: Date) => isPast(date) || isUnavailable(date);
  }, [isPast, isUnavailable]);

  const isBookable = useMemo(() => {
    return (date: Date) => {
      if (isPast(date)) return false;
      const entry = availabilityMap.get(formatDateKeyLocal(date));
      return entry?.available ?? false;
    };
  }, [availabilityMap, isPast]);

  return (
    <div className={cn("relative isolate w-full max-w-full min-w-0 overflow-hidden", className)}>
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        selected={selected}
        onSelect={onSelect}
        disabled={disabledDays}
        showOutsideDays
        fixedWeeks
        components={{ DayButton: VenueDayButton }}
        className="w-full max-w-full min-w-0 bg-transparent p-0 [--cell-size:clamp(1.85rem,11vw,2.5rem)]"
        classNames={{
          root: "w-full max-w-full min-w-0",
          months: "relative flex w-full max-w-full min-w-0 flex-col",
          month: "relative flex w-full max-w-full min-w-0 flex-col gap-3 pt-1",
          month_grid: "w-full max-w-full min-w-0",
          weeks: "w-full max-w-full min-w-0",
          nav: "pointer-events-none absolute inset-x-0 top-1 z-10 flex items-center justify-between px-0.5",
          month_caption:
            "pointer-events-none flex h-10 w-full items-center justify-center px-10 sm:px-11",
          caption_label:
            "pointer-events-auto text-sm font-semibold text-white sm:text-base",
          weekdays: "flex w-full min-w-0 border-b border-[#303030] pb-2",
          weekday:
            "min-w-0 flex-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-400 sm:text-xs",
          week: "mt-1.5 flex w-full min-w-0",
          day: "relative min-w-0 flex-1 p-0 text-center",
          outside:
            "[&_button]:text-zinc-600 [&_button]:opacity-60",
          disabled:
            "[&_button]:cursor-not-allowed [&_button]:text-zinc-600 [&_button]:opacity-35",
          today:
            "[&:not([data-selected=true])_button]:ring-1 [&:not([data-selected=true])_button]:ring-primary/50",
          button_previous:
            "pointer-events-auto inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#404040] bg-[#2a2a2a] text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 sm:size-9",
          button_next:
            "pointer-events-auto inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-[#404040] bg-[#2a2a2a] text-primary shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40 sm:size-9",
        }}
        modifiers={{ bookable: isBookable }}
        modifiersClassNames={{
          bookable:
            "relative after:absolute after:bottom-0.5 after:left-1/2 after:z-10 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary after:content-[''] [&_button:not([data-selected-single=true])]:font-medium [&_button:not([data-selected-single=true])]:text-zinc-100 [&_button:not([data-selected-single=true])]:hover:bg-primary/15",
        }}
      />
      <div
        className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-[#303030] pt-3 text-xs text-zinc-500"
        role="list"
        aria-label={t("checkAvailability")}
      >
        <span className="flex items-center gap-1.5" role="listitem">
          <span className="h-2 w-2 rounded-full bg-primary" aria-hidden />
          {t("available")}
        </span>
        <span className="flex items-center gap-1.5" role="listitem">
          <span className="h-2 w-2 rounded-full bg-zinc-600" aria-hidden />
          {t("unavailable")}
        </span>
      </div>
    </div>
  );
}
