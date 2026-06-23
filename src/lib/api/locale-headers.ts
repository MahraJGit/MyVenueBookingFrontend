import { resolveLocale, type AppLocale } from "@/i18n/locales";
import { getAcceptLanguageHeader } from "@/lib/locale-storage";

export function withLocaleHeaders(init?: RequestInit): RequestInit {
  const locale = resolveLocale(getAcceptLanguageHeader()) as AppLocale;
  const headers = new Headers(init?.headers ?? undefined);
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", locale);
  }
  return { ...init, headers };
}
