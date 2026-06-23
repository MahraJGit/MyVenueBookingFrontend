"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  DEFAULT_LOCALE,
  isRtlLocale,
  resolveLocale,
  type AppLocale,
} from "@/i18n/locales";
import { persistLocale, readStoredLocale } from "@/lib/locale-storage";

type LocaleContextValue = {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  isRtl: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const serverLocale = resolveLocale(useLocale());
  const router = useRouter();
  const [locale, setLocaleState] = useState<AppLocale>(serverLocale);
  const syncedRef = useRef(false);

  useEffect(() => {
    setLocaleState(serverLocale);
    document.documentElement.lang = serverLocale;
    document.documentElement.dir = isRtlLocale(serverLocale) ? "rtl" : "ltr";
  }, [serverLocale]);

  useEffect(() => {
    if (syncedRef.current) return;
    syncedRef.current = true;
    const stored = readStoredLocale();
    if (stored !== serverLocale) {
      persistLocale(stored);
      router.refresh();
    }
  }, [serverLocale, router]);

  const setLocale = useCallback(
    (next: AppLocale) => {
      if (next === locale) return;
      setLocaleState(next);
      persistLocale(next);
      router.refresh();
    },
    [locale, router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      isRtl: isRtlLocale(locale),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be used within LocaleProvider");
  }
  return ctx;
}

export function useAppLocale(): AppLocale {
  const ctx = useContext(LocaleContext);
  return ctx?.locale ?? DEFAULT_LOCALE;
}
