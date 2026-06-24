"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

export function useDayNames(): readonly string[] {
  const t = useTranslations("venueSchedule");
  return useMemo(
    () => [
      t("sunday"),
      t("monday"),
      t("tuesday"),
      t("wednesday"),
      t("thursday"),
      t("friday"),
      t("saturday"),
    ],
    [t],
  );
}
