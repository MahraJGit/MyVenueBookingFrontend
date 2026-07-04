"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { VenueCard } from "@/components/venues/VenueCard";
import { RecommendedVenuesSlider, useRecommendedVenuesVisible } from "@/components/recommendations/RecommendedVenuesSlider";
import { ListingGridDivider } from "@/components/recommendations/RecommendationsCarousel";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { VenueTypeFilters } from "@/components/venues/VenueTypeFilters";
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
import { venueKeys } from "@/features/venues/query-keys";
import { useLocaleContext } from "@/features/i18n/locale-context";
import {
  useListingLabels,
  useVenueSortOptions,
} from "@/features/i18n/use-listing-filters";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;

function sortValueFromParams(
  sortBy: string,
  sortOrder: string,
  sortOptions: ReturnType<typeof useVenueSortOptions>,
): string {
  const match = sortOptions.find(
    (o) => o.sortBy === sortBy && o.sortOrder === sortOrder,
  );
  return match?.value ?? "createdAt-desc";
}

export function VenuesListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("venuesListing");
  const { locale } = useLocaleContext();
  const sortOptions = useVenueSortOptions();
  const labels = useListingLabels();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const venueTypeIdFromUrl = searchParams.get("venueTypeId")?.trim() ?? "";
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
      const href = qs ? `/venues?${qs}` : "/venues";
      if (replace) router.replace(href, { scroll: false });
      else router.push(href);
    },
    [router, searchParams],
  );

  const handleTypeChange = useCallback(
    (typeId: string) => {
      pushParams({ venueTypeId: typeId || undefined, page: undefined }, true);
    },
    [pushParams],
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

  const { data: types = [], isLoading: loadingTypes } = useQuery({
    queryKey: [...venueKeys.types(), locale],
    queryFn: listVenueTypes,
  });

  const activeTypeName =
    types.find((type) => type.id === venueTypeIdFromUrl)?.name ?? null;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: venueKeys.publicList({
      page,
      locale,
      search: searchFromUrl,
      city: cityFromUrl,
      venueTypeId: venueTypeIdFromUrl,
      sortBy,
      sortOrder,
    }),
    queryFn: () =>
      listPublicVenues({
        page,
        limit: PAGE_SIZE,
        search: searchFromUrl || undefined,
        city: cityFromUrl || undefined,
        venueTypeId: venueTypeIdFromUrl || undefined,
        sortBy: sortBy as "createdAt" | "name",
        sortOrder: sortOrder as "asc" | "desc",
      }),
  });

  const venues = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;
  const { showGridDivider } = useRecommendedVenuesVisible();
  const tRecommendations = useTranslations("recommendations");

  return (
    <section className="eventslist py-10 pt-24 sm:pt-28">
      <div className="container mx-auto px-4">
        <div className="mb-10 max-w-3xl text-start">
          <h1 className="page-title mb-3 text-white">
            {t("title")}{" "}
            <span className="text-gradient-accent">{t("titleHighlight")}</span>
          </h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <VenueTypeFilters
          types={types}
          activeTypeId={venueTypeIdFromUrl}
          onTypeChange={handleTypeChange}
          isLoading={loadingTypes}
        />

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
            <SelectTrigger className="w-full border-[#303030] bg-black text-white sm:w-[180px]">
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

        <RecommendedVenuesSlider />

        {showGridDivider ? (
          <ListingGridDivider label={tRecommendations("allVenues")} />
        ) : null}

        {isError ? (
          <p className="mb-8 py-8 text-sm text-red-400">
            {error instanceof Error ? error.message : t("couldNotLoad")}
          </p>
        ) : null}

        {isLoading ? (
          <ResponsiveEventCardsGrid className="mb-8">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-[20px] bg-[#242424]"
              />
            ))}
          </ResponsiveEventCardsGrid>
        ) : venues.length === 0 ? (
          <p className="mb-8 py-8 text-sm text-[#B3B3B3]">
            {t("noVenuesFound")}
            {activeTypeName ? ` ${t("inType", { type: activeTypeName })}` : ""}
            {searchFromUrl ? ` ${labels.matching(searchFromUrl)}` : ""}
            {cityFromUrl ? ` ${labels.inCity(cityFromUrl)}` : ""}.
          </p>
        ) : (
          <div className="relative mb-8">
            {isFetching && !isLoading ? (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[1px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : null}
            <ResponsiveEventCardsGrid key={`venues-grid-${locale}`}>
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
              className="border-[#303030] sm:min-w-[7rem]"
              disabled={page <= 1 || isFetching}
              onClick={() => {
                pushParams({ page: page <= 2 ? undefined : String(page - 1) });
              }}
            >
              {labels.previous}
            </Button>
            <span className="flex items-center justify-center px-2 text-center text-sm text-muted-foreground sm:px-4">
              {data?.meta.total != null
                ? labels.pageOfWithCount(page, totalPages, data.meta.total, "venues")
                : labels.pageOf(page, totalPages)}
            </span>
            <Button
              variant="outline"
              className="border-[#303030] sm:min-w-[7rem]"
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
