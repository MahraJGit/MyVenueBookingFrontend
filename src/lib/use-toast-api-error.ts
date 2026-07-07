"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { toast } from "sonner";
import { ApiError, resolveApiErrorForToast } from "@/lib/api/errors";

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
        const { title, description } = resolveApiErrorForToast(error, {
          multipleValidationTitle: t("validationSummary"),
        });
        toast.error(title, description ? { description } : undefined);
        return;
      }
      toast.error(fallbackMessage ?? t("generic"));
    },
    [t],
  );
}
