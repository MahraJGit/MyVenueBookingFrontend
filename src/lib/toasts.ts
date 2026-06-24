import { createTranslator } from "next-intl";
import { toast } from "sonner";
import { ApiError, formatFieldErrorsForToast } from "@/lib/api/errors";
import { DEFAULT_LOCALE, type AppLocale } from "@/i18n/locales";
import { readStoredLocale } from "@/lib/locale-storage";
import en from "../../messages/en.json";
import ur from "../../messages/ur.json";
import de from "../../messages/de.json";
import ar from "../../messages/ar.json";
import fr from "../../messages/fr.json";

const messagesByLocale: Record<AppLocale, typeof en> = { en, ur, de, ar, fr };

function toastTranslator() {
  const locale =
    typeof window !== "undefined" ? readStoredLocale() : DEFAULT_LOCALE;
  const messages = messagesByLocale[locale] ?? en;
  return createTranslator({ locale, messages, namespace: "toasts" });
}

/** Centralized toast for API failures (handles validation arrays from Express). */
export function toastApiError(error: unknown, fallbackMessage?: string): void {
  if (error instanceof ApiError && error.statusCode === 0) {
    toast.error(error.message);
    return;
  }
  if (error instanceof ApiError) {
    const extra = formatFieldErrorsForToast(error.fieldErrors);
    toast.error(error.message, extra ? { description: extra } : undefined);
    return;
  }
  toast.error(fallbackMessage ?? toastTranslator()("somethingWentWrong"));
}
