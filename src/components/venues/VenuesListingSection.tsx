"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { VenueCard } from "@/components/venues/VenueCard";
import { VenuesListingHero } from "@/components/venues/VenuesListingHero";
import {
  RecommendedVenuesSlider,
  useRecommendedVenuesVisible,
} from "@/components/recommendations/RecommendedVenuesSlider";
import { ListingGridDivider } from "@/components/recommendations/RecommendationsCarousel";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { Button } from "@/components/ui/button";
import { listPublicVenues, listVenueTypes } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import {
  formatVenueTypeLabel,
  getVenueTypeCategories,
  getVenueTypeSubcategories,
} from "@/features/venues/utils";
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api";
import { locationKeys } from "@/features/locations/query-keys";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { useCurrency } from "@/features/currency/currency-context";
import { buildPriceBounds } from "@/features/events/price-filter";
import {
  useListingLabels,
  useVenueSortOptions,
} from "@/features/i18n/use-listing-filters";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;
const LISTING_GRID_CLASS = "mb-8";

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

function parseOptionalPrice(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function VenuesListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("venuesListing");
  const { locale } = useLocaleContext();
  const { displayCurrency, rates } = useCurrency();
  const sortOptions = useVenueSortOptions();
  const labels = useListingLabels();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const venueTypeIdFromUrl = searchParams.get("venueTypeId")?.trim() ?? "";
  const venueCategoryIdFromUrl =
    searchParams.get("venueCategoryId")?.trim() ?? "";
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";
  const countryCodeFromUrl = searchParams.get("countryCode")?.trim() ?? "";
  const minPriceFromUrl = searchParams.get("minPrice")?.trim() ?? "";
  const maxPriceFromUrl = searchParams.get("maxPrice")?.trim() ?? "";
  const priceCurrencyFromUrl =
    searchParams.get("priceCurrency")?.trim().toUpperCase() || displayCurrency;

  const sortValue = sortValueFromParams(sortBy, sortOrder, sortOptions);

  const [search, setSearch] = useState(searchFromUrl);
  const [city, setCity] = useState(cityFromUrl);
  const [countryCode, setCountryCode] = useState(countryCodeFromUrl);
  const [venueCategoryId, setVenueCategoryId] = useState(venueCategoryIdFromUrl);
  const [venueTypeId, setVenueTypeId] = useState(venueTypeIdFromUrl);
  const [minPrice, setMinPrice] = useState(minPriceFromUrl);
  const [maxPrice, setMaxPrice] = useState(maxPriceFromUrl);
  const [sortDraft, setSortDraft] = useState(sortValue);

  useEffect(() => {
    setSearch(searchFromUrl);
    setCity(cityFromUrl);
    setCountryCode(countryCodeFromUrl);
    setVenueCategoryId(venueCategoryIdFromUrl);
    setVenueTypeId(venueTypeIdFromUrl);
    setMinPrice(minPriceFromUrl);
    setMaxPrice(maxPriceFromUrl);
    setSortDraft(sortValue);
  }, [
    searchFromUrl,
    cityFromUrl,
    countryCodeFromUrl,
    venueCategoryIdFromUrl,
    venueTypeIdFromUrl,
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
      const href = qs ? `/venues?${qs}` : "/venues";
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
      venueCategoryId: venueCategoryId || undefined,
      venueTypeId: venueTypeId || undefined,
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

  const handleCategoryChange = (categoryId: string) => {
    setVenueCategoryId(categoryId);
    setVenueTypeId("");
  };

  const clearFilters = () => {
    setSearch("");
    setCity("");
    setCountryCode("");
    setVenueCategoryId("");
    setVenueTypeId("");
    setMinPrice("");
    setMaxPrice("");
    setSortDraft("createdAt-desc");
    pushParams({
      search: undefined,
      city: undefined,
      countryCode: undefined,
      venueCategoryId: undefined,
      venueTypeId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      priceCurrency: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      page: undefined,
    });
  };

  const { data: allTypes = [], isLoading: loadingTypes } = useQuery({
    queryKey: [...venueKeys.types(), locale],
    queryFn: () => listVenueTypes(),
  });

  const categories = useMemo(
    () => getVenueTypeCategories(allTypes),
    [allTypes],
  );
  const subcategories = useMemo(() => {
    const leaves = getVenueTypeSubcategories(allTypes);
    if (!venueCategoryId) return leaves;
    return leaves.filter((type) => type.parentId === venueCategoryId);
  }, [allTypes, venueCategoryId]);

  const { data: countries = [] } = useQuery({
    queryKey: locationKeys.countries(true),
    queryFn: () => listCountries({ activeOnly: true }),
  });

  const { data: cities = [] } = useQuery({
    queryKey: locationKeys.cities(countryCode, { activeOnly: true, featuredOnly: true }),
    queryFn: () => listCitiesByCountryCode(countryCode, { activeOnly: true, featuredOnly: true }),
    enabled: Boolean(countryCode),
  });

  const activeType =
    allTypes.find((type) => type.id === venueTypeIdFromUrl) ?? null;
  const activeTypeName = activeType
    ? formatVenueTypeLabel(activeType)
    : null;
  const activeCategoryName =
    categories.find((type) => type.id === venueCategoryIdFromUrl)?.name ?? null;

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
    queryKey: venueKeys.publicList({
      page,
      locale,
      search: searchFromUrl,
      city: cityFromUrl,
      countryCode: countryCodeFromUrl,
      venueCategoryId: venueCategoryIdFromUrl,
      venueTypeId: venueTypeIdFromUrl,
      minPrice: minPriceFromUrl,
      maxPrice: maxPriceFromUrl,
      priceCurrency: priceCurrencyFromUrl,
      ratesReady: Object.keys(rates).length,
      sortBy,
      sortOrder,
    }),
    queryFn: () =>
      listPublicVenues({
        page,
        limit: PAGE_SIZE,
        search: searchFromUrl || undefined,
        city: cityFromUrl || undefined,
        countryCode: countryCodeFromUrl || undefined,
        venueCategoryId: venueCategoryIdFromUrl || undefined,
        venueTypeId: venueTypeIdFromUrl || undefined,
        minPrice: minPriceNum,
        maxPrice: maxPriceNum,
        priceCurrency: priceCurrencyFromUrl,
        priceBounds: priceBounds.length ? priceBounds : undefined,
        sortBy: sortBy as "createdAt" | "name",
        sortOrder: sortOrder as "asc" | "desc",
      }),
  });

  const venues = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;
  const showClearFilters = Boolean(
    searchFromUrl ||
      cityFromUrl ||
      countryCodeFromUrl ||
      venueCategoryIdFromUrl ||
      venueTypeIdFromUrl ||
      minPriceFromUrl ||
      maxPriceFromUrl ||
      sortBy !== "createdAt" ||
      sortOrder !== "desc",
  );
  const showRecommendations = !showClearFilters;
  const { showGridDivider } = useRecommendedVenuesVisible(showRecommendations);
  const tRecommendations = useTranslations("recommendations");

  return (
    <section className="eventslist py-10 pt-24 sm:pt-28">
      <div className="container mx-auto px-4">
        <VenuesListingHero
          categories={categories}
          types={subcategories}
          venueCategoryId={venueCategoryId}
          onVenueCategoryChange={handleCategoryChange}
          venueTypeId={venueTypeId}
          onVenueTypeChange={setVenueTypeId}
          loadingTypes={loadingTypes}
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
          searchPlaceholder={labels.searchVenues}
          labels={labels}
        />

        {showRecommendations ? (
          <div className="mb-10">
            <RecommendedVenuesSlider />
          </div>
        ) : null}

        <div className="min-w-0 pt-2 sm:pt-4">
          {showGridDivider ? (
            <ListingGridDivider label={tRecommendations("allVenues")} />
          ) : null}

          {isError ? (
            <p className="mb-8 py-8 text-sm text-red-400">
              {error instanceof Error ? error.message : t("couldNotLoad")}
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
          ) : venues.length === 0 ? (
            <p className="mb-8 py-8 text-sm text-[#B3B3B3]">
              {t("noVenuesFound")}
              {activeTypeName
                ? ` ${t("inType", { type: activeTypeName })}`
                : activeCategoryName
                  ? ` ${t("inCategory", { category: activeCategoryName })}`
                  : ""}
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
                  ? labels.pageOfWithCount(page, totalPages, data.meta.total, "venues")
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
