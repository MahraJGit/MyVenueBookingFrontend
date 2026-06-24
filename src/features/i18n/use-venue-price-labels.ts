"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

export type VenuePriceLabels = {
  perDay: string;
  perHour: string;
  flatRate: string;
  from: string;
  perUnit: string;
  perBooking: string;
  perGuestPackage: (name: string) => string;
  perGuestFromPackages: string;
};

export function useVenuePriceLabels(): VenuePriceLabels {
  const t = useTranslations("venues");

  return useMemo(
    () => ({
      perDay: t("perDay"),
      perHour: t("perHour"),
      flatRate: t("flatRate"),
      from: t("fromLabel"),
      perUnit: t("perUnitSuffix"),
      perBooking: t("perBookingSuffix"),
      perGuestPackage: (name: string) => t("perGuestPackage", { name }),
      perGuestFromPackages: t("perGuestFromPackages"),
    }),
    [t],
  );
}
