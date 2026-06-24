export const LOCALES = ["en", "ur", "de", "ar", "fr"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LOCALE_STORAGE_KEY = "mvb_locale";

export const RTL_LOCALES: AppLocale[] = ["ar", "ur"];

export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale as AppLocale);
}

export type CountryCode = "GB" | "PK" | "DE" | "SA" | "FR";

export type LocaleMeta = {
  code: AppLocale;
  label: string;
  nativeLabel: string;
  countryCode: CountryCode;
  dir: "ltr" | "rtl";
};

export const LOCALE_OPTIONS: LocaleMeta[] = [
  { code: "en", label: "English", nativeLabel: "English", countryCode: "GB", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", countryCode: "PK", dir: "rtl" },
  { code: "de", label: "German", nativeLabel: "Deutsch", countryCode: "DE", dir: "ltr" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", countryCode: "SA", dir: "rtl" },
  { code: "fr", label: "French", nativeLabel: "Français", countryCode: "FR", dir: "ltr" },
];

export function isAppLocale(value: string): value is AppLocale {
  return (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | null | undefined): AppLocale {
  if (value && isAppLocale(value)) return value;
  return DEFAULT_LOCALE;
}
