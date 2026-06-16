import { TZDate } from "@date-fns/tz";

/**
 * Convert a local date (YYYY-MM-DD) + time (HH:mm) in a venue timezone to UTC ISO string.
 */
export function localSlotToUtcIso(
  dateStr: string,
  timeStr: string,
  timezone: string,
): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);
  const local = new TZDate(year, month - 1, day, hour, minute, 0, 0, timezone);
  return local.toISOString();
}

/**
 * Build UTC start/end from selected availability slots on the same day.
 */
export function slotRangeToUtc(
  dateStr: string,
  startTime: string,
  endTime: string,
  timezone: string,
): { startTime: string; endTime: string } {
  return {
    startTime: localSlotToUtcIso(dateStr, startTime, timezone),
    endTime: localSlotToUtcIso(dateStr, endTime, timezone),
  };
}

/**
 * Format a UTC ISO instant in the venue's timezone for display.
 */
export function formatInVenueTimezone(
  iso: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: timezone }).format(d);
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
