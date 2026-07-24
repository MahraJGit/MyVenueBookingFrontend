"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { VenueCard } from "@/components/venues/VenueCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPublicVenues, listVenueTypes } from "@/features/venues/api";
import type { PublicVenue } from "@/features/venues/types";
import {
  isCorporateHubVenueType,
} from "@/features/market-segments/constants";
import { venueKeys } from "@/features/venues/query-keys";
import {
  useListingLabels,
  useVenueSortOptions,
} from "@/features/i18n/use-listing-filters";
import { useTranslations } from "next-intl";
import { useLocaleContext } from "@/features/i18n/locale-context";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;

function sortValueFromParams(
  sortBy: string,
  sortOrder: string,
  options: { sortBy: string; sortOrder: string; value: string }[],
): string {
  const match = options.find(
    (o) => o.sortBy === sortBy && o.sortOrder === sortOrder,
  );
  return match?.value ?? "createdAt-desc";
}

function sortMergedVenues(
  venues: PublicVenue[],
  sortBy: string,
  sortOrder: string,
  locale: string,
): PublicVenue[] {
  const dir = sortOrder === "asc" ? 1 : -1;
  return [...venues].sort((a, b) => {
    if (sortBy === "name") {
      return dir * a.name.localeCompare(b.name, locale);
    }
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return dir * (aTime - bTime);
  });
}

function CardSkeletonGrid({ count = PAGE_SIZE }: { count?: number }) {
  return (
    <ResponsiveEventCardsGrid>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-[420px] animate-pulse rounded-[20px] bg-[#242424]"
        />
      ))}
    </ResponsiveEventCardsGrid>
  );
}

type SegmentHubPageProps = {
  variant: "corporate";
};

export function SegmentHubPage({ variant: _variant }: SegmentHubPageProps) {
  const t = useTranslations("marketSegments");
  const { locale } = useLocaleContext();
  const labels = useListingLabels();
  const sortOptions = useVenueSortOptions();

  const basePath = "/corporate";

  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";
  const sortValue = sortValueFromParams(sortBy, sortOrder, sortOptions);

  const [search, setSearch] = useState(searchFromUrl);
  const [city, setCity] = useState(cityFromUrl);

  useEffect(() => {
    setSearch(searchFromUrl);
    setCity(cityFromUrl);
  }, [searchFromUrl, cityFromUrl]);

  const pushParams = useCallback(
    (patch: Record<string, string | undefined>, replace = false) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value?.trim()) sp.set(key, value.trim());
        else sp.delete(key);
      }
      const qs = sp.toString();
      const href = qs ? `${basePath}?${qs}` : basePath;
      if (replace) router.replace(href, { scroll: false });
      else router.push(href);
    },
    [basePath, router, searchParams],
  );

  const applyFilters = () => {
    pushParams({
      search: search || undefined,
      city: city || undefined,
      page: undefined,
    });
  };

  const handleSortChange = (value: string) => {
    const option = sortOptions.find((o) => o.value === value);
    if (!option) return;
    const isDefault =
      option.sortBy === "createdAt" && option.sortOrder === "desc";
    pushParams({
      sortBy: isDefault ? undefined : option.sortBy,
      sortOrder: isDefault ? undefined : option.sortOrder,
      page: undefined,
    });
  };

  const description = t("corporateDescription");

  const { data: venueTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: [...venueKeys.types(), locale],
    queryFn: listVenueTypes,
  });

  const corporateTypeIds = venueTypes
    .filter(isCorporateHubVenueType)
    .map((t) => t.id);

  const {
    data: venuesResult,
    isLoading: loadingVenues,
    isFetching: fetchingVenues,
    isError: venuesError,
    error: venuesErr,
  } = useQuery({
    queryKey: [
      "public-venues",
      "hub",
      locale,
      page,
      corporateTypeIds,
      searchFromUrl,
      cityFromUrl,
      sortBy,
      sortOrder,
    ],
    queryFn: async () => {
      const responses = await Promise.all(
        corporateTypeIds.map((venueTypeId) =>
          listPublicVenues({
            page: 1,
            limit: 100,
            venueTypeId,
            search: searchFromUrl || undefined,
            city: cityFromUrl || undefined,
            sortBy: sortBy as "createdAt" | "name",
            sortOrder: sortOrder as "asc" | "desc",
          }),
        ),
      );

      const byId = new Map<string, PublicVenue>();
      for (const response of responses) {
        for (const venue of response.data) {
          byId.set(venue.id, venue);
        }
      }

      const merged = sortMergedVenues(
        [...byId.values()],
        sortBy,
        sortOrder,
        locale,
      );
      const total = merged.length;
      const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
      const safePage = Math.min(page, totalPages);
      const start = (safePage - 1) * PAGE_SIZE;

      return {
        data: merged.slice(start, start + PAGE_SIZE),
        meta: {
          total,
          page: safePage,
          limit: PAGE_SIZE,
          totalPages,
        },
      };
    },
    enabled: corporateTypeIds.length > 0,
  });

  const venues: PublicVenue[] = venuesResult?.data ?? [];
  const isLoading = loadingTypes || loadingVenues;
  const isFetching = fetchingVenues;
  const isError = venuesError;
  const error = venuesErr;
  const meta = venuesResult?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;
  const items = venues;

  return (
    <section className="eventslist public-listing-section">
      <div className="container mx-auto px-4">
        <div className="section-header mb-10 max-w-3xl text-start">
          <h1 className="page-title mb-3 text-white">
            {t("corporateTitle")}{" "}
            <span className="text-gradient-accent">
              {t("corporateHighlight")}
            </span>
          </h1>
          <p className="text-muted-foreground">{description}</p>
        </div>

        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder={labels.searchVenues}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            className="w-full border-[#303030] bg-black text-white sm:max-w-xs"
          />
          <Input
            placeholder={labels.city}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            className="w-full border-[#303030] bg-black text-white sm:max-w-[160px]"
          />
          <Select value={sortValue} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full border-[#303030] bg-black text-white hover:bg-black dark:hover:bg-black data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-[3px] sm:w-[180px]">
              <SelectValue placeholder={labels.sortBy} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2 sm:contents">
            <Button onClick={applyFilters} className="w-full bg-primary sm:w-auto">
              <Search className="me-2 h-4 w-4" />
              {labels.search}
            </Button>
            {(searchFromUrl || cityFromUrl) && (
              <Button
                variant="outline"
                className="w-full border-[#303030] text-muted-foreground sm:w-auto"
                onClick={() => {
                  setSearch("");
                  setCity("");
                  pushParams({ search: undefined, city: undefined, page: undefined });
                }}
              >
                {labels.clearFilters}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-3 border-b border-[#1F1F1F] pb-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-start">{t("venuesSection")}</h2>
          <Link
            href="/venues"
            className="w-full shrink-0 rounded-full border border-primary px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:text-primary sm:w-auto"
          >
            {t("viewAllVenues")}
          </Link>
        </div>

        {isError ? (
          <p className="mb-8 py-8 text-sm text-red-400">
            {error instanceof Error ? error.message : labels.couldNotLoad}
          </p>
        ) : null}

        {!loadingTypes && corporateTypeIds.length === 0 ? (
          <p className="py-8 text-sm text-[#B3B3B3]">
            {t("corporateTypesNotConfigured")}
          </p>
        ) : isLoading ? (
          <CardSkeletonGrid />
        ) : items.length === 0 ? (
          <p className="mb-8 py-8 text-sm text-[#B3B3B3]">
            {t("noCorporateVenues")}
            {searchFromUrl ? ` ${labels.matching(searchFromUrl)}` : ""}
            {cityFromUrl ? ` ${labels.inCity(cityFromUrl)}` : ""}.{" "}
            <Link href="/venues" className="text-primary hover:underline">
              {t("browseAllVenues")}
            </Link>
            .
          </p>
        ) : (
          <div className="relative mb-8">
            {isFetching && !isLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[1px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : null}
            <ResponsiveEventCardsGrid key={`corporate-venues-${locale}`}>
              {venues.map((venue) => (
                <VenueCard key={venue.id} venue={venue} />
              ))}
            </ResponsiveEventCardsGrid>
          </div>
        )}

        {showPagination ? (
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-2">
            <Button
              variant="outline"
              className="border-[#303030] hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:bg-transparent sm:min-w-[7rem]"
              disabled={page <= 1 || isFetching}
              onClick={() => {
                pushParams({ page: page <= 2 ? undefined : String(page - 1) });
              }}
            >
              {labels.previous}
            </Button>
            <span className="flex items-center justify-center px-2 text-center text-sm text-muted-foreground sm:px-4">
              {meta?.total != null
                ? labels.pageOfWithCount(page, totalPages, meta.total, "venues")
                : labels.pageOf(page, totalPages)}
            </span>
            <Button
              variant="outline"
              className="border-[#303030] hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:bg-transparent sm:min-w-[7rem]"
              disabled={page >= totalPages || isFetching}
              onClick={() => {
                pushParams({ page: String(page + 1) });
              }}
            >
              {labels.next}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
