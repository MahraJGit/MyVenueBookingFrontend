"use client";

import * as React from "react";
import { CalendarIcon, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, index) => index);
const MINUTES = Array.from({ length: 60 }, (_, index) => index);

export function parseDatetimeLocalValue(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function parseTimeValue(value: string): { hour: number; minute: number } | null {
  if (!value) return null;
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return { hour, minute };
}

export function toTimeValue(hour: number, minute: number): string {
  return `${pad2(hour)}:${pad2(minute)}`;
}

type TimeScrollColumnProps = {
  label: string;
  values: number[];
  selected: number;
  onSelect: (value: number) => void;
};

function TimeScrollColumn({
  label,
  values,
  selected,
  onSelect,
}: TimeScrollColumnProps) {
  const listRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const selectedButton = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-time-value="${selected}"]`,
    );
    selectedButton?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [selected]);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="border-b border-border/80 px-3 py-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 bg-gradient-to-b from-popover to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-popover to-transparent"
        />
        <div
          ref={listRef}
          className="h-44 overflow-y-auto overscroll-contain scroll-smooth px-2 py-6 [scrollbar-width:thin]"
        >
          {values.map((value) => {
            const isSelected = value === selected;
            return (
              <button
                key={value}
                type="button"
                data-time-value={value}
                onClick={() => onSelect(value)}
                className={cn(
                  "mx-auto my-0.5 flex h-9 w-full max-w-[4.5rem] items-center justify-center rounded-lg text-sm tabular-nums transition-colors",
                  isSelected
                    ? "bg-primary/15 font-semibold text-primary shadow-[inset_0_0_0_1px_rgba(236,72,153,0.35)]"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                {pad2(value)}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type TimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
};

export function TimePicker({
  value,
  onChange,
  placeholder,
  disabled,
  className,
  triggerClassName,
  popoverClassName,
}: TimePickerProps) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  const parsed = parseTimeValue(value);
  const hour = parsed?.hour ?? 9;
  const minute = parsed?.minute ?? 0;

  const updateTime = React.useCallback(
    (nextHour: number, nextMinute: number) => {
      onChange(toTimeValue(nextHour, nextMinute));
    },
    [onChange],
  );

  const displayLabel = parsed
    ? toTimeValue(parsed.hour, parsed.minute)
    : placeholder ?? tCommon("pickTime");

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start border-border text-left font-normal tabular-nums",
              !parsed && "text-muted-foreground",
              triggerClassName,
            )}
          >
            <Clock className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn("w-auto overflow-hidden p-0 shadow-lg", popoverClassName)}
        >
          <div className="bg-muted/15 sm:w-[13.5rem]">
            <div className="flex items-center justify-center gap-2 border-b border-border/80 px-4 py-3">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-2xl font-semibold tabular-nums tracking-wide text-foreground">
                {pad2(hour)}:{pad2(minute)}
              </span>
            </div>

            <div className="flex divide-x divide-border/80">
              <TimeScrollColumn
                label={tCommon("hour")}
                values={HOURS}
                selected={hour}
                onSelect={(nextHour) => updateTime(nextHour, minute)}
              />
              <TimeScrollColumn
                label={tCommon("minute")}
                values={MINUTES}
                selected={minute}
                onSelect={(nextMinute) => updateTime(hour, nextMinute)}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type DatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Matcher for calendar days that cannot be selected (react-day-picker). */
  disabledDates?: React.ComponentProps<typeof Calendar>["disabled"];
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
  formatLabel?: (date: Date) => string;
};

export function parseDateValue(value: string): Date | null {
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [year, month, day] = trimmed.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function toDateValue(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  required,
  disabled,
  disabledDates,
  className,
  triggerClassName,
  popoverClassName,
  formatLabel,
}: DatePickerProps) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  const selected = parseDateValue(value);

  const displayLabel = selected
    ? formatLabel
      ? formatLabel(selected)
      : selected.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
    : placeholder ?? tCommon("pickDate");

  return (
    <div className={className}>
      <input
        required={required}
        value={value}
        readOnly
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start border-border text-left font-normal",
              !selected && "text-muted-foreground",
              triggerClassName,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn("w-auto overflow-hidden p-0 shadow-lg", popoverClassName)}
        >
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selected ?? undefined}
              disabled={disabledDates}
              onSelect={(date) => {
                if (!date) return;
                onChange(toDateValue(date));
                setOpen(false);
              }}
              className="rounded-md border border-border bg-transparent"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type DateTimePickerProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  popoverClassName?: string;
  formatLabel?: (date: Date) => string;
};

export function DateTimePicker({
  value,
  onChange,
  placeholder,
  required,
  disabled,
  className,
  triggerClassName,
  popoverClassName,
  formatLabel,
}: DateTimePickerProps) {
  const tCommon = useTranslations("common");
  const [open, setOpen] = React.useState(false);
  const selected = parseDatetimeLocalValue(value);
  const hour = selected?.getHours() ?? 12;
  const minute = selected?.getMinutes() ?? 0;

  const updateTime = React.useCallback(
    (nextHour: number, nextMinute: number) => {
      const base = selected ?? new Date();
      const next = new Date(base);
      next.setHours(nextHour, nextMinute, 0, 0);
      onChange(toDatetimeLocalValue(next));
    },
    [onChange, selected],
  );

  const onDateSelect = (date?: Date) => {
    if (!date) return;
    const base = selected ?? new Date();
    const next = new Date(date);
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(toDatetimeLocalValue(next));
  };

  const displayLabel = selected
    ? formatLabel
      ? formatLabel(selected)
      : selected.toLocaleString()
    : placeholder ?? tCommon("pickDateTime");

  return (
    <div className={className}>
      <input
        required={required}
        value={value}
        readOnly
        className="sr-only"
        tabIndex={-1}
        aria-hidden
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start border-border text-left font-normal",
              !selected && "text-muted-foreground",
              triggerClassName,
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn(
            "w-auto overflow-hidden p-0 shadow-lg",
            popoverClassName,
          )}
        >
          <div className="flex flex-col sm:flex-row">
            <div className="p-2">
              <Calendar
                mode="single"
                selected={selected ?? undefined}
                onSelect={onDateSelect}
                className="rounded-md border border-border bg-transparent"
              />
            </div>

            <div className="border-t border-border bg-muted/15 sm:w-[13.5rem] sm:border-t-0 sm:border-l">
              <div className="flex items-center justify-center gap-2 border-b border-border/80 px-4 py-3">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-2xl font-semibold tabular-nums tracking-wide text-foreground">
                  {pad2(hour)}:{pad2(minute)}
                </span>
              </div>

              <div className="flex divide-x divide-border/80">
                <TimeScrollColumn
                  label={tCommon("hour")}
                  values={HOURS}
                  selected={hour}
                  onSelect={(nextHour) => updateTime(nextHour, minute)}
                />
                <TimeScrollColumn
                  label={tCommon("minute")}
                  values={MINUTES}
                  selected={minute}
                  onSelect={(nextMinute) => updateTime(hour, nextMinute)}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
