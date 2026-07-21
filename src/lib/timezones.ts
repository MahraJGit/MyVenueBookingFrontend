/** Curated IANA timezones shown in admin/city selectors. */
export const COMMON_TIMEZONES = [
  "UTC",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Asia/Kuwait",
  "Asia/Bahrain",
  "Asia/Muscat",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Amsterdam",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Istanbul",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Australia/Sydney",
  "Australia/Melbourne",
  "Pacific/Auckland",
] as const;

/**
 * Prefer the runtime IANA list when available; otherwise fall back to a curated set.
 */
export function listTimezones(): string[] {
  try {
    const supported = (
      Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf?.("timeZone");
    if (supported?.length) {
      return [...supported].sort((a, b) => a.localeCompare(b));
    }
  } catch {
    // ignore — older runtimes
  }
  return [...COMMON_TIMEZONES];
}

/** Current offset for a zone, e.g. "UTC+05:00" or "UTC-04:00". */
export function getTimezoneUtcOffset(timeZone: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(at);
    const raw = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
    // Normalize GMT±H[:MM] / UTC±H[:MM] → UTC±HH:MM
    const normalized = raw.replace(/^GMT/i, "UTC");
    const match = normalized.match(/^UTC([+-])(\d{1,2})(?::?(\d{2}))?$/i);
    if (!match) return normalized === "UTC" ? "UTC+00:00" : normalized;
    const sign = match[1];
    const hours = match[2].padStart(2, "0");
    const minutes = (match[3] ?? "00").padStart(2, "0");
    return `UTC${sign}${hours}:${minutes}`;
  } catch {
    return "UTC";
  }
}

/** Label for selects: "Asia/Karachi (UTC+05:00)" */
export function formatTimezoneLabel(timeZone: string, at: Date = new Date()): string {
  return `${timeZone} (${getTimezoneUtcOffset(timeZone, at)})`;
}

/** Append IANA timezone to a formatted time, e.g. "7:00 PM · Asia/Dubai". */
export function withTimezoneLabel(
  formatted: string,
  timeZone?: string | null,
): string {
  const tz = timeZone?.trim();
  if (!formatted || !tz) return formatted;
  if (formatted.includes(tz)) return formatted;
  return `${formatted} · ${tz}`;
}
