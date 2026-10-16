"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { EventsListingHero } from "@/components/events/EventsListingHero";
import {
  RecommendedEventsSlider,
  useRecommendedEventsVisible,
} from "@/components/recommendations/RecommendedEventsSlider";
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
import { buildEventPriceBounds } from "@/features/events/price-filter";
import { useCurrency } from "@/features/currency/currency-context";
import { useLocaleContext } from "@/features/i18n/locale-context";
import {
  useEventSortOptions,
  useListingLabels,
} from "@/features/i18n/use-listing-filters";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;
const LISTING_GRID_CLASS = "mb-8";

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

function parseOptionalPrice(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Convert YYYY-MM-DD into start/end of local day ISO strings for the API. */
function dateKeyToRange(dateKey: string): { startDate: string; endDate: string } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null;
  const [y, m, d] = dateKey.split("-").map(Number);
  const start = new Date(y, m - 1, d, 0, 0, 0, 0);
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

export function EventsListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tEvents = useTranslations("events");
  const { locale } = useLocaleContext();
  const { displayCurrency, rates } = useCurrency();
  const sortOptions = useEventSortOptions();
  const labels = useListingLabels();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const categoryFromUrl = searchParams.get("category")?.trim() ?? "";
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const countryCodeFromUrl = searchParams.get("countryCode")?.trim() ?? "";
  const dateFromUrl = searchParams.get("date")?.trim() ?? "";
  const minPriceFromUrl = searchParams.get("minPrice")?.trim() ?? "";
  const maxPriceFromUrl = searchParams.get("maxPrice")?.trim() ?? "";
  const priceCurrencyFromUrl =
    searchParams.get("priceCurrency")?.trim().toUpperCase() || displayCurrency;
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const activeCategory = categoryFromUrl || ALL_EVENTS_CATEGORY;
  const sortValue = sortValueFromParams(sortBy, sortOrder, sortOptions);

  const [search, setSearch] = useState(searchFromUrl);
  const [city, setCity] = useState(cityFromUrl);
  const [countryCode, setCountryCode] = useState(countryCodeFromUrl);
  const [category, setCategory] = useState(activeCategory);
  const [date, setDate] = useState(dateFromUrl);
  const [minPrice, setMinPrice] = useState(minPriceFromUrl);
  const [maxPrice, setMaxPrice] = useState(maxPriceFromUrl);
  const [sortDraft, setSortDraft] = useState(sortValue);

  useEffect(() => {
    setSearch(searchFromUrl);
    setCity(cityFromUrl);
    setCountryCode(countryCodeFromUrl);
    setCategory(activeCategory);
    setDate(dateFromUrl);
    setMinPrice(minPriceFromUrl);
    setMaxPrice(maxPriceFromUrl);
    setSortDraft(sortValue);
  }, [
    searchFromUrl,
    cityFromUrl,
    countryCodeFromUrl,
    activeCategory,
    dateFromUrl,
    minPriceFromUrl,
    maxPriceFromUrl,
    sortValue,
  ]);

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

  // Keep active price filters tied to the currently selected display currency.
  useEffect(() => {
    if (!minPriceFromUrl && !maxPriceFromUrl) return;
    if (priceCurrencyFromUrl === displayCurrency) return;
    pushParams({ priceCurrency: displayCurrency }, true);
  }, [
    displayCurrency,
    minPriceFromUrl,
    maxPriceFromUrl,
    priceCurrencyFromUrl,
    pushParams,
  ]);

  const applyFilters = () => {
    const option = sortOptions.find((o) => o.value === sortDraft);
    const isDefaultSort =
      !option ||
      (option.sortBy === "createdAt" && option.sortOrder === "desc");

    let nextMin = parseOptionalPrice(minPrice);
    let nextMax = parseOptionalPrice(maxPrice);
    if (nextMin != null && nextMax != null && nextMin > nextMax) {
      [nextMin, nextMax] = [nextMax, nextMin];
      setMinPrice(String(nextMin));
      setMaxPrice(String(nextMax));
    }

    const hasPrice = nextMin != null || nextMax != null;

    pushParams({
      search: search || undefined,
      city: city || undefined,
      countryCode: countryCode || undefined,
      category: categoryQueryValue(category),
      date: date || undefined,
      minPrice: nextMin?.toString(),
      maxPrice: nextMax?.toString(),
      priceCurrency: hasPrice ? displayCurrency : undefined,
      sortBy: isDefaultSort ? undefined : option?.sortBy,
      sortOrder: isDefaultSort ? undefined : option?.sortOrder,
      page: undefined,
    });
  };

  const handleCountryChange = (value: string) => {
    const next = value === "__all__" ? "" : value;
    setCountryCode(next);
    setCity("");
  };

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setCountryCode("");
    setCategory(ALL_EVENTS_CATEGORY);
    setDate("");
    setMinPrice("");
    setMaxPrice("");
    setSortDraft("createdAt-desc");
    pushParams({
      search: undefined,
      city: undefined,
      countryCode: undefined,
      category: undefined,
      date: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      priceCurrency: undefined,
      sortBy: undefined,
      sortOrder: undefined,
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

  const dateRange = dateFromUrl ? dateKeyToRange(dateFromUrl) : null;
  const minPriceNum = parseOptionalPrice(minPriceFromUrl);
  const maxPriceNum = parseOptionalPrice(maxPriceFromUrl);
  const priceBounds = buildEventPriceBounds(
    minPriceNum,
    maxPriceNum,
    priceCurrencyFromUrl,
    rates,
  );

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
      dateFromUrl,
      minPriceFromUrl,
      maxPriceFromUrl,
      priceCurrencyFromUrl,
      // Re-run when FX rates arrive so converted bounds stay accurate.
      Object.keys(rates).length,
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
        startDate: dateRange?.startDate,
        endDate: dateRange?.endDate,
        minPrice: minPriceNum,
        maxPrice: maxPriceNum,
        priceCurrency: priceCurrencyFromUrl,
        priceBounds: priceBounds.length ? priceBounds : undefined,
        sortBy: sortBy as "createdAt" | "startDateTime" | "eventName",
        sortOrder: sortOrder as "asc" | "desc",
      }),
  });

  const events = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;
  const showClearFilters = Boolean(
    searchFromUrl ||
      cityFromUrl ||
      countryCodeFromUrl ||
      categoryFromUrl ||
      dateFromUrl ||
      minPriceFromUrl ||
      maxPriceFromUrl ||
      sortBy !== "createdAt" ||
      sortOrder !== "desc",
  );

  const showRecommendations = !showClearFilters;
  const { showGridDivider } = useRecommendedEventsVisible(showRecommendations);
  const tRecommendations = useTranslations("recommendations");

  return (
    <section className="eventslist py-10 pt-24 sm:pt-28">
      <div className="container mx-auto px-4">
        <EventsListingHero
          categoryOptions={categoryOptions}
          category={category}
          onCategoryChange={setCategory}
          loadingCategories={loadingCategories}
          search={search}
          onSearchChange={setSearch}
          countryCode={countryCode}
          onCountryChange={handleCountryChange}
          city={city}
          onCityChange={setCity}
          countries={countries}
          cities={cities}
          date={date}
          onDateChange={setDate}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          displayCurrency={displayCurrency}
          sortValue={sortDraft}
          sortOptions={sortOptions}
          onSortChange={setSortDraft}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          showClearFilters={showClearFilters}
          labels={labels}
        />

        {showRecommendations ? (
          <div className="mb-10">
            <RecommendedEventsSlider />
          </div>
        ) : null}

        <div className="min-w-0 pt-2 sm:pt-4">
          {showGridDivider ? (
            <ListingGridDivider label={tRecommendations("allEvents")} />
          ) : null}

          {isError ? (
            <p className="mb-8 py-8 text-sm text-red-400">
              {error instanceof Error ? error.message : tEvents("couldNotLoadEvents")}
            </p>
          ) : null}

          {isLoading ? (
            <ResponsiveEventCardsGrid className={LISTING_GRID_CLASS}>
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
              <ResponsiveEventCardsGrid>
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
    </section>
  );
}
