"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EventCard } from "@/components/events/EventCard";
import { EventCategoryFilters } from "@/components/events/EventCategoryFilters";
import { EventsPageHeader } from "@/components/events/EventsPageHeader";
import { RecommendedEventsSlider, useRecommendedEventsVisible } from "@/components/recommendations/RecommendedEventsSlider";
import { ListingGridDivider } from "@/components/recommendations/RecommendationsCarousel";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import {
  listPublicEventCategories,
  toEventCategoryOption,
} from "@/features/event-categories/api";
import { listPublicEvents } from "@/features/events/api";
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api";
import { locationKeys } from "@/features/locations/query-keys";
import {
  ALL_EVENTS_CATEGORY,
  categoryQueryValue,
} from "@/features/events/utils";
import { useLocaleContext } from "@/features/i18n/locale-context";
import {
  useEventSortOptions,
  useListingLabels,
} from "@/features/i18n/use-listing-filters";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;
const LISTING_GRID_CLASS = "mb-8";
const LISTING_THREE_COL_GRID = { maxThreeColumns: true as const };

function sortValueFromParams(
  sortBy: string,
  sortOrder: string,
  sortOptions: ReturnType<typeof useEventSortOptions>,
): string {
  const match = sortOptions.find(
    (o) => o.sortBy === sortBy && o.sortOrder === sortOrder,
  );
  return match?.value ?? "createdAt-desc";
}

export function EventsListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");
  const { locale } = useLocaleContext();
  const sortOptions = useEventSortOptions();
  const labels = useListingLabels();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const categoryFromUrl = searchParams.get("category")?.trim() ?? "";
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const countryCodeFromUrl = searchParams.get("countryCode")?.trim() ?? "";

  const activeCategory = categoryFromUrl || ALL_EVENTS_CATEGORY;
  const sortValue = sortValueFromParams(sortBy, sortOrder, sortOptions);

  const [search, setSearch] = useState(searchFromUrl);
  const [city, setCity] = useState(cityFromUrl);
  const [countryCode, setCountryCode] = useState(countryCodeFromUrl);

  useEffect(() => {
    setSearch(searchFromUrl);
    setCity(cityFromUrl);
    setCountryCode(countryCodeFromUrl);
  }, [searchFromUrl, cityFromUrl, countryCodeFromUrl]);

  const pushParams = useCallback(
    (patch: Record<string, string | undefined>, replace = false) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value?.trim()) sp.set(key, value.trim());
        else sp.delete(key);
      }
      const qs = sp.toString();
      const href = qs ? `/events?${qs}` : "/events";
      if (replace) router.replace(href, { scroll: false });
      else router.push(href);
    },
    [router, searchParams],
  );

  const handleCategoryChange = useCallback(
    (category: string) => {
      const value = categoryQueryValue(category);
      pushParams({ category: value, page: undefined }, true);
    },
    [pushParams],
  );

  const applyFilters = () => {
    pushParams({
      search: search || undefined,
      city: city || undefined,
      countryCode: countryCode || undefined,
      page: undefined,
    });
  };

  const handleCountryChange = (value: string) => {
    const next = value === "__all__" ? "" : value;
    setCountryCode(next);
    setCity("");
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

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["public-event-categories", locale],
    queryFn: listPublicEventCategories,
  });

  const { data: countries = [] } = useQuery({
    queryKey: locationKeys.countries(true),
    queryFn: () => listCountries({ activeOnly: true }),
  });

  const { data: cities = [] } = useQuery({
    queryKey: locationKeys.cities(countryCode, { activeOnly: true, featuredOnly: true }),
    queryFn: () => listCitiesByCountryCode(countryCode, { activeOnly: true, featuredOnly: true }),
    enabled: Boolean(countryCode),
  });

  const categoryOptions = categories.map(toEventCategoryOption);
  const activeCategoryLabel =
    categoryOptions.find((c) => c.value === activeCategory)?.label ??
    activeCategory;

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "public-events",
      "listing",
      locale,
      page,
      categoryFromUrl,
      searchFromUrl,
      cityFromUrl,
      countryCodeFromUrl,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      listPublicEvents({
        page,
        limit: PAGE_SIZE,
        search: searchFromUrl || undefined,
        city: cityFromUrl || undefined,
        countryCode: countryCodeFromUrl || undefined,
        category: categoryFromUrl || undefined,
        sortBy: sortBy as "createdAt" | "startDateTime" | "eventName",
        sortOrder: sortOrder as "asc" | "desc",
      }),
  });

  const events = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;
  const { showGridDivider } = useRecommendedEventsVisible();
  const tRecommendations = useTranslations("recommendations");

  return (
    <section className="eventslist py-10 pt-24 sm:pt-28">
      <div className="container mx-auto px-4">
        <EventsPageHeader />

        <div className="mb-10">
          <RecommendedEventsSlider />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:items-start lg:gap-10">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-1">
            <div>
              <h2 className="mb-3 text-sm font-medium text-white">
                {tEvents("category")}
              </h2>
              <EventCategoryFilters
                categories={categoryOptions}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                isLoading={loadingCategories}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
              <h2 className="text-sm font-medium text-white">{tCommon("filter")}</h2>
              <Input
                placeholder={labels.searchEvents}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
                className="w-full border-[#303030] bg-black text-white"
              />
              <Select
                value={countryCode || "__all__"}
                onValueChange={handleCountryChange}
              >
                <SelectTrigger className="w-full border-[#303030] bg-black text-white">
                  <SelectValue placeholder={labels.country} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{labels.allCountries}</SelectItem>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={city || "__all__"}
                onValueChange={(v) => setCity(v === "__all__" ? "" : v)}
                disabled={!countryCode}
              >
                <SelectTrigger className="w-full border-[#303030] bg-black text-white">
                  <SelectValue
                    placeholder={
                      countryCode ? labels.city : labels.selectCountryFirst
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">{labels.city}</SelectItem>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full border-[#303030] bg-black text-white hover:bg-black dark:hover:bg-black data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-[3px]">
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
              <Button onClick={applyFilters} className="w-full bg-primary">
                <Search className="me-2 h-4 w-4" />
                {labels.search}
              </Button>
              {(searchFromUrl || cityFromUrl || countryCodeFromUrl) && (
                <Button
                  variant="outline"
                  className="w-full border-[#303030] text-muted-foreground"
                  onClick={() => {
                    setSearch("");
                    setCity("");
                    setCountryCode("");
                    pushParams({
                      search: undefined,
                      city: undefined,
                      countryCode: undefined,
                      page: undefined,
                    });
                  }}
                >
                  {labels.clearFilters}
                </Button>
              )}
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-3">
            {showGridDivider ? (
              <ListingGridDivider label={tRecommendations("allEvents")} />
            ) : null}

            {isError ? (
              <p className="mb-8 py-8 text-sm text-red-400">
                {error instanceof Error ? error.message : tEvents("couldNotLoadEvents")}
              </p>
            ) : null}

            {isLoading ? (
              <ResponsiveEventCardsGrid
                className={LISTING_GRID_CLASS}
                {...LISTING_THREE_COL_GRID}
              >
                {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[420px] animate-pulse rounded-[20px] bg-[#242424]"
                  />
                ))}
              </ResponsiveEventCardsGrid>
            ) : events.length === 0 ? (
              <p className="mb-8 py-8 text-sm text-[#B3B3B3]">
                {activeCategory !== ALL_EVENTS_CATEGORY
                  ? tEvents("noEventsInCategory", { category: activeCategoryLabel })
                  : tEvents("noEventsFound")}
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
                <ResponsiveEventCardsGrid {...LISTING_THREE_COL_GRID}>
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} />
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
                  {data?.meta.total != null
                    ? labels.pageOfWithCount(page, totalPages, data.meta.total, "events")
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
        </div>
      </div>
    </section>
  );
}
