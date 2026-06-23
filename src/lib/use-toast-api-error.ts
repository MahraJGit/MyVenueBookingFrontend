"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { ApiError, formatFieldErrorsForToast } from "@/lib/api/errors";

/** Client-side toast helper with translated fallback messages. */
export function useToastApiError() {
  const t = useTranslations("errors");

  return useCallback(
    (error: unknown, fallbackMessage?: string) => {
      if (error instanceof ApiError && error.statusCode === 0) {
        toast.error(t("network"));
        return;
      }
      if (error instanceof ApiError) {
        const extra = formatFieldErrorsForToast(error.fieldErrors);
        toast.error(error.message, extra ? { description: extra } : undefined);
        return;
      }
      toast.error(fallbackMessage ?? t("generic"));
    },
    [t],
  );
}
