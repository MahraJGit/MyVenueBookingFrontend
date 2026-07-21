import { TZDate } from "@date-fns/tz";
import { getIntlLocale } from "@/i18n/locales";
import { withTimezoneLabel } from "@/lib/timezones";

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
 * Pass `locale` (app locale like `ur`) so month/day names follow the UI language.
 */
export function formatInVenueTimezone(
  iso: string,
  timezone: string,
  locale?: string | null,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const formatted = new Intl.DateTimeFormat(getIntlLocale(locale), {
    ...options,
    timeZone: timezone,
  }).format(d);
  return withTimezoneLabel(formatted, timezone);
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Civil YYYY-MM-DD for an instant in an IANA timezone. */
export function formatDateKeyInTimezone(isoOrDate: string | Date, timezone: string): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** "Today" as YYYY-MM-DD in the given timezone. */
export function todayDateKeyInTimezone(timezone: string, now = new Date()): string {
  return formatDateKeyInTimezone(now, timezone);
}

/** Parse a YYYY-MM-DD (or date input value) into a stable UTC midnight ISO for `@db.Date`. */
export function dateInputToUtcDateIso(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) {
    throw new Error("Invalid date");
  }
  return new Date(Date.UTC(y, m - 1, d)).toISOString();
}

/** Display a `@db.Date` / UTC-midnight ISO as YYYY-MM-DD (calendar date, not browser-local). */
export function utcDateIsoToDateInput(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Format a UTC ISO instant as `YYYY-MM-DDTHH:mm` in the venue timezone (for datetime-local inputs). */
export function utcIsoToDatetimeLocalValue(iso: string, timezone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour").padStart(2, "0");
  const minute = get("minute").padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/** Parse a datetime-local value as venue-local time and return UTC ISO. */
export function datetimeLocalValueToUtcIso(value: string, timezone: string): string {
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) {
    throw new Error("Invalid datetime-local value");
  }
  return localSlotToUtcIso(datePart, timePart, timezone);
}
