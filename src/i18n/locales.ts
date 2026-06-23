export const LOCALES = ["en", "ur", "de", "ar", "fr"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_STORAGE_KEY = "mvb_locale";

export const RTL_LOCALES: AppLocale[] = ["ar", "ur"];

export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale as AppLocale);
}

export type LocaleMeta = {
  code: AppLocale;
  label: string;
  nativeLabel: string;
  flag: string;
  dir: "ltr" | "rtl";
};

export const LOCALE_OPTIONS: LocaleMeta[] = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", flag: "🇵🇰", dir: "rtl" },
  { code: "de", label: "German", nativeLabel: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Français", flag: "🇫🇷", dir: "ltr" },
];

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  if (value && isAppLocale(value)) return value;
  return DEFAULT_LOCALE;
}
