"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
import type { MonthAvailabilityDay } from "@/features/venues/types";
import { cn } from "@/lib/utils";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { getDateFnsLocale } from "@/lib/date-locale";
import { todayDateKeyInTimezone } from "@/features/venues/timezone";

type AvailabilityCalendarProps = {
  month: Date;
  onMonthChange: (month: Date) => void;
  availability: MonthAvailabilityDay[];
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  /** IANA timezone used to decide "today" / past days for the venue. */
  timezone?: string;
  className?: string;
};

function formatDateKeyLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function VenueDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof CalendarDayButton>) {
  const isSelected =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle;

  return (
    <CalendarDayButton
      day={day}
      modifiers={modifiers}
      className={cn(
        "relative min-w-0 max-w-full rounded-md text-[0.8125rem] leading-none font-normal transition-[color,background-color,box-shadow] duration-150",
        "data-[selected-single=true]:bg-zinc-600 data-[selected-single=true]:text-white data-[selected-single=true]:shadow-sm",
        "data-[selected-single=true]:hover:bg-zinc-500",
        modifiers.disabled &&
          "cursor-not-allowed text-zinc-600 opacity-40 hover:bg-transparent hover:text-zinc-600",
        !modifiers.disabled &&
          !modifiers.today &&
          !isSelected &&
          "text-zinc-300 hover:bg-zinc-800/90 hover:text-white",
        modifiers.bookable &&
          !modifiers.disabled &&
          !modifiers.today &&
          !isSelected &&
          "font-medium text-zinc-100",
        modifiers.today &&
          !isSelected &&
          "font-semibold text-white ring-1 ring-primary/70 ring-offset-1 ring-offset-[#1B1B1B]",
        modifiers.today && isSelected && "font-semibold text-white ring-1 ring-primary/50",
        modifiers.outside && !modifiers.disabled && "text-zinc-500 opacity-70",
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
  timezone,
  className,
}: AvailabilityCalendarProps) {
  const t = useTranslations("venues");
  const tCommon = useTranslations("common");
  const { locale } = useLocaleContext();
  const dateFnsLocale = getDateFnsLocale(locale);
  const todayKey = useMemo(
    () => (timezone ? todayDateKeyInTimezone(timezone) : formatDateKeyLocal(new Date())),
    [timezone],
  );

  const availabilityMap = useMemo(() => {
    const map = new Map<string, MonthAvailabilityDay>();
    for (const day of availability) {
      map.set(day.date, day);
    }
    return map;
  }, [availability]);

  const isPast = useMemo(() => {
    return (date: Date) => formatDateKeyLocal(date) < todayKey;
  }, [todayKey]);

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

  const isClosed = useMemo(() => {
    return (date: Date) => !isPast(date) && isUnavailable(date);
  }, [isPast, isUnavailable]);

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
        locale={dateFnsLocale}
        components={{ DayButton: VenueDayButton }}
        className="w-full max-w-full min-w-0 bg-transparent p-0 [--cell-size:clamp(1.55rem,7.5vw,2rem)] sm:[--cell-size:clamp(1.65rem,6.5vw,2.05rem)]"
        classNames={{
          root: "w-full max-w-full min-w-0",
          months: "relative flex w-full max-w-full min-w-0 flex-col",
          month: "relative flex w-full max-w-full min-w-0 flex-col gap-2 pt-0.5",
          month_grid: "w-full max-w-full min-w-0",
          weeks: "w-full max-w-full min-w-0",
          nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-between px-0",
          month_caption:
            "pointer-events-none flex h-9 w-full items-center justify-center px-9 sm:px-10",
          caption_label:
            "pointer-events-auto text-sm font-semibold tracking-tight text-white",
          weekdays: "flex w-full min-w-0 border-b border-[#303030]/80 pb-1.5",
          weekday:
            "min-w-0 flex-1 text-center text-[0.625rem] font-semibold uppercase tracking-wider text-zinc-500 sm:text-[0.6875rem]",
          week: "mt-1 flex w-full min-w-0",
          day: "relative min-w-0 flex-1 p-0 text-center",
          outside: "[&_button]:text-zinc-600",
          disabled: "[&_button]:pointer-events-none",
          today: "",
          button_previous:
            "pointer-events-auto inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[#3a3a3a] bg-[#252525] text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/40 sm:size-8",
          button_next:
            "pointer-events-auto inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-[#3a3a3a] bg-[#252525] text-primary transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/40 sm:size-8",
        }}
        modifiers={{
          bookable: isBookable,
          past: isPast,
          closed: isClosed,
        }}
        modifiersClassNames={{
          past: "[&_button]:text-zinc-600 [&_button]:opacity-30",
          closed:
            "[&_button]:text-zinc-500 [&_button]:opacity-50 [&_button]:line-through [&_button]:decoration-zinc-600",
          bookable:
            "[&:not([data-today])]:after:absolute [&:not([data-today])]:after:bottom-0 [&:not([data-today])]:after:left-1/2 [&:not([data-today])]:after:z-10 [&:not([data-today])]:after:h-1 [&:not([data-today])]:after:w-1 [&:not([data-today])]:after:-translate-x-1/2 [&:not([data-today])]:after:rounded-full [&:not([data-today])]:after:bg-emerald-400/90 [&:not([data-today])]:after:content-['']",
          today:
            "after:absolute after:bottom-0 after:left-1/2 after:z-10 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-primary after:content-['']",
        }}
      />
      <div
        className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-[#303030]/80 pt-2.5 text-[0.6875rem] text-zinc-500 sm:gap-x-5 sm:text-xs"
        role="list"
        aria-label={t("checkAvailability")}
      >
        <span className="flex items-center gap-1.5" role="listitem">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          {tCommon("today")}
        </span>
        <span className="flex items-center gap-1.5" role="listitem">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/90" aria-hidden />
          {t("available")}
        </span>
        <span className="flex items-center gap-1.5" role="listitem">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" aria-hidden />
          {t("unavailable")}
        </span>
      </div>
    </div>
  );
}
