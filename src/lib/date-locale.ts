import { enUS, de, ar, fr, type Locale } from "date-fns/locale";
import { getIntlLocale, resolveLocale, type AppLocale } from "@/i18n/locales";

// date-fns has no Urdu locale (`ur`); fall back to enUS for calendar/date-fns
// formatters. Intl.DateTimeFormat still uses ur-PK via getIntlLocale().
const DATE_FNS_LOCALES: Record<AppLocale, Locale> = {
  en: enUS,
  ur: enUS,
  de,
  ar,
  fr,
};

export function getDateFnsLocale(locale?: string | null): Locale {
  return DATE_FNS_LOCALES[resolveLocale(locale)];
}

export function formatLocalizedDateTime(
  iso: string,
  locale?: string | null,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  },
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(getIntlLocale(locale), options).format(d);
}
