"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AttractionCard } from "@/components/attractions/AttractionCard";
import { AttractionsListingHero } from "@/components/attractions/AttractionsListingHero";
import {
  RecommendedAttractionsSlider,
  useRecommendedAttractionsVisible,
} from "@/components/recommendations/RecommendedAttractionsSlider";
import { ListingGridDivider } from "@/components/recommendations/RecommendationsCarousel";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { Button } from "@/components/ui/button";
import {
  listPublicAttractionCategories,
  toAttractionCategoryOption,
} from "@/features/attraction-categories/api";
import { listPublicAttractions } from "@/features/attractions/api";
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api";
import { locationKeys } from "@/features/locations/query-keys";
import {
  ALL_ATTRACTIONS_CATEGORY,
  categoryQueryValue,
} from "@/features/attractions/utils";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { useCurrency } from "@/features/currency/currency-context";
import { buildPriceBounds } from "@/features/events/price-filter";
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

export function AttractionsListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tAttractions = useTranslations("attractions");
  const { locale } = useLocaleContext();
  const { displayCurrency, rates } = useCurrency();
  const sortOptions = useEventSortOptions();
  const labels = useListingLabels();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const categoryFromUrl = searchParams.get("category")?.trim() ?? "";
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";
  const countryCodeFromUrl = searchParams.get("countryCode")?.trim() ?? "";
  const minPriceFromUrl = searchParams.get("minPrice")?.trim() ?? "";
  const maxPriceFromUrl = searchParams.get("maxPrice")?.trim() ?? "";
  const priceCurrencyFromUrl =
    searchParams.get("priceCurrency")?.trim().toUpperCase() || displayCurrency;

  const activeCategory = categoryFromUrl || ALL_ATTRACTIONS_CATEGORY;
  const sortValue = sortValueFromParams(sortBy, sortOrder, sortOptions);

  const [search, setSearch] = useState(searchFromUrl);
  const [city, setCity] = useState(cityFromUrl);
  const [countryCode, setCountryCode] = useState(countryCodeFromUrl);
  const [category, setCategory] = useState(activeCategory);
  const [minPrice, setMinPrice] = useState(minPriceFromUrl);
  const [maxPrice, setMaxPrice] = useState(maxPriceFromUrl);
  const [sortDraft, setSortDraft] = useState(sortValue);

  useEffect(() => {
    setSearch(searchFromUrl);
    setCity(cityFromUrl);
    setCountryCode(countryCodeFromUrl);
    setCategory(activeCategory);
    setMinPrice(minPriceFromUrl);
    setMaxPrice(maxPriceFromUrl);
    setSortDraft(sortValue);
  }, [
    searchFromUrl,
    cityFromUrl,
    countryCodeFromUrl,
    activeCategory,
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
      const href = qs ? `/attractions?${qs}` : "/attractions";
      if (replace) router.replace(href, { scroll: false });
      else router.push(href);
    },
    [router, searchParams],
  );

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
    setCategory(ALL_ATTRACTIONS_CATEGORY);
    setMinPrice("");
    setMaxPrice("");
    setSortDraft("createdAt-desc");
    pushParams({
      search: undefined,
      city: undefined,
      countryCode: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      priceCurrency: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      page: undefined,
    });
  };

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["public-attraction-categories", locale],
    queryFn: listPublicAttractionCategories,
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

  const categoryOptions = categories.map(toAttractionCategoryOption);
  const activeCategoryLabel =
    categoryOptions.find((c) => c.value === activeCategory)?.label ??
    activeCategory;

  const minPriceNum = parseOptionalPrice(minPriceFromUrl);
  const maxPriceNum = parseOptionalPrice(maxPriceFromUrl);
  const priceBounds = buildPriceBounds(
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
      "public-attractions",
      "listing",
      locale,
      page,
      categoryFromUrl,
      searchFromUrl,
      cityFromUrl,
      countryCodeFromUrl,
      minPriceFromUrl,
      maxPriceFromUrl,
      priceCurrencyFromUrl,
      Object.keys(rates).length,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      listPublicAttractions({
        page,
        limit: PAGE_SIZE,
        search: searchFromUrl || undefined,
        city: cityFromUrl || undefined,
        countryCode: countryCodeFromUrl || undefined,
        category: categoryFromUrl || undefined,
        minPrice: minPriceNum,
        maxPrice: maxPriceNum,
        priceCurrency: priceCurrencyFromUrl,
        priceBounds: priceBounds.length ? priceBounds : undefined,
        sortBy:
          sortBy === "eventName" || sortBy === "startDateTime"
            ? "name"
            : (sortBy as "createdAt" | "name" | "scheduleStartDate"),
        sortOrder: sortOrder as "asc" | "desc",
      }),
  });

  const attractions = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;
  const showClearFilters = Boolean(
    searchFromUrl ||
      cityFromUrl ||
      countryCodeFromUrl ||
      categoryFromUrl ||
      minPriceFromUrl ||
      maxPriceFromUrl ||
      sortBy !== "createdAt" ||
      sortOrder !== "desc",
  );
  const showRecommendations = !showClearFilters;
  const { showGridDivider } =
    useRecommendedAttractionsVisible(showRecommendations);
  const tRecommendations = useTranslations("recommendations");

  return (
    <section className="eventslist py-10 pt-24 sm:pt-28">
      <div className="container mx-auto px-4">
        <AttractionsListingHero
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
            <RecommendedAttractionsSlider />
          </div>
        ) : null}

        <div className="min-w-0 pt-2 sm:pt-4">
          {showGridDivider ? (
            <ListingGridDivider label={tRecommendations("allAttractions")} />
          ) : null}

          {isError ? (
            <p className="mb-8 py-8 text-sm text-red-400">
              {error instanceof Error
                ? error.message
                : tAttractions("couldNotLoadAttractions")}
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
          ) : attractions.length === 0 ? (
            <p className="mb-8 py-8 text-sm text-[#B3B3B3]">
              {activeCategory !== ALL_ATTRACTIONS_CATEGORY
                ? tAttractions("noAttractionsInCategory", {
                    category: activeCategoryLabel,
                  })
                : tAttractions("noAttractionsFound")}
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
                {attractions.map((attraction) => (
                  <AttractionCard key={attraction.id} attraction={attraction} />
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
                  ? tAttractions("pageOfWithCount", {
                      page,
                      totalPages,
                      total: data.meta.total,
                    })
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
