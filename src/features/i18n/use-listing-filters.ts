"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

export type SortOption = {
  value: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  label: string;
};

export function useEventSortOptions(): SortOption[] {
  const t = useTranslations("listing");
  return useMemo(
    () => [
      {
        value: "createdAt-desc",
        sortBy: "createdAt",
        sortOrder: "desc",
        label: t("sortNewest"),
      },
      {
        value: "startDateTime-asc",
        sortBy: "startDateTime",
        sortOrder: "asc",
        label: t("sortSoonest"),
      },
      {
        value: "eventName-asc",
        sortBy: "eventName",
        sortOrder: "asc",
        label: t("sortNameAsc"),
      },
      {
        value: "eventName-desc",
        sortBy: "eventName",
        sortOrder: "desc",
        label: t("sortNameDesc"),
      },
    ],
    [t],
  );
}

export function useVenueSortOptions(): SortOption[] {
  const t = useTranslations("listing");
  return useMemo(
    () => [
      {
        value: "createdAt-desc",
        sortBy: "createdAt",
        sortOrder: "desc",
        label: t("sortNewest"),
      },
      {
        value: "name-asc",
        sortBy: "name",
        sortOrder: "asc",
        label: t("sortNameAsc"),
      },
      {
        value: "name-desc",
        sortBy: "name",
        sortOrder: "desc",
        label: t("sortNameDesc"),
      },
    ],
    [t],
  );
}

export function useListingLabels() {
  const t = useTranslations("listing");
  const tCommon = useTranslations("common");

  return useMemo(
    () => ({
      country: t("country"),
      allCountries: t("allCountries"),
      selectCountryFirst: t("selectCountryFirst"),
      city: t("city"),
      searchCountry: t("searchCountry"),
      searchCity: t("searchCity"),
      sortBy: t("sortBy"),
      searchEvents: t("searchEvents"),
      searchVenues: t("searchVenues"),
      clearFilters: t("clearFilters"),
      matching: (term: string) => t("matching", { term }),
      inCity: (city: string) => t("inCity", { city }),
      pageOf: (page: number, totalPages: number) =>
        t("pageOf", { page, totalPages }),
      pageOfWithCount: (page: number, totalPages: number, total: number, type: "events" | "venues") =>
        t("pageOfWithCount", {
          page,
          totalPages,
          total,
          type: type === "events" ? t("eventsCount") : t("venuesCount"),
        }),
      couldNotLoad: t("couldNotLoad"),
      search: tCommon("search"),
      previous: tCommon("previous"),
      next: tCommon("next"),
    }),
    [t, tCommon],
  );
}
