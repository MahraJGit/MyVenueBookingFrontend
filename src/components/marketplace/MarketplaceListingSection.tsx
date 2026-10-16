"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { MarketplaceServiceCard } from "@/components/marketplace/MarketplaceServiceCard";
import { ALL_MARKETPLACE_CATEGORIES } from "@/components/marketplace/MarketplaceCategoryFilters";
import { MarketplaceListingHero } from "@/components/marketplace/MarketplaceListingHero";
import {
  RecommendedMarketplaceSlider,
  useRecommendedMarketplaceVisible,
} from "@/components/recommendations/RecommendedMarketplaceSlider";
import { ListingGridDivider } from "@/components/recommendations/RecommendationsCarousel";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { Button } from "@/components/ui/button";
import {
  listPublicMarketplaceServices,
  listServiceCategories,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api";
import { locationKeys } from "@/features/locations/query-keys";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { useCurrency } from "@/features/currency/currency-context";
import { buildPriceBounds } from "@/features/events/price-filter";
import { useListingLabels } from "@/features/i18n/use-listing-filters";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;
const LISTING_GRID_CLASS = "mb-8";

const SORT_OPTIONS = [
  { value: "createdAt-desc", sortBy: "createdAt", sortOrder: "desc" },
  { value: "createdAt-asc", sortBy: "createdAt", sortOrder: "asc" },
  { value: "title-asc", sortBy: "title", sortOrder: "asc" },
  { value: "title-desc", sortBy: "title", sortOrder: "desc" },
  { value: "basePrice-asc", sortBy: "basePrice", sortOrder: "asc" },
  { value: "basePrice-desc", sortBy: "basePrice", sortOrder: "desc" },
] as const;

function parseOptionalPrice(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export function MarketplaceListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("marketplace");
  const { locale } = useLocaleContext();
  const { displayCurrency, rates } = useCurrency();
  const labels = useListingLabels();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const categoryIdFromUrl = searchParams.get("categoryId")?.trim() ?? "";
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const countryCodeFromUrl = searchParams.get("countryCode")?.trim() ?? "";
  const minPriceFromUrl = searchParams.get("minPrice")?.trim() ?? "";
  const maxPriceFromUrl = searchParams.get("maxPrice")?.trim() ?? "";
  const priceCurrencyFromUrl =
    searchParams.get("priceCurrency")?.trim().toUpperCase() || displayCurrency;
  const sortBy = (searchParams.get("sortBy") ?? "createdAt") as
    | "createdAt"
    | "title"
    | "basePrice";
  const sortOrder = (searchParams.get("sortOrder") ?? "desc") as "asc" | "desc";

  const activeCategory = categoryIdFromUrl || ALL_MARKETPLACE_CATEGORIES;
  const sortValue =
    SORT_OPTIONS.find((o) => o.sortBy === sortBy && o.sortOrder === sortOrder)
      ?.value ?? "createdAt-desc";

  const [search, setSearch] = useState(searchFromUrl);
  const [city, setCity] = useState(cityFromUrl);
  const [countryCode, setCountryCode] = useState(countryCodeFromUrl);
  const [categoryId, setCategoryId] = useState(activeCategory);
  const [minPrice, setMinPrice] = useState(minPriceFromUrl);
  const [maxPrice, setMaxPrice] = useState(maxPriceFromUrl);
  const [sortDraft, setSortDraft] = useState(sortValue);

  useEffect(() => {
    setSearch(searchFromUrl);
    setCity(cityFromUrl);
    setCountryCode(countryCodeFromUrl);
    setCategoryId(activeCategory);
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
      const href = qs ? `/marketplace?${qs}` : "/marketplace";
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
    const option = SORT_OPTIONS.find((o) => o.value === sortDraft);
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
      categoryId:
        categoryId === ALL_MARKETPLACE_CATEGORIES ? undefined : categoryId,
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
    setCategoryId(ALL_MARKETPLACE_CATEGORIES);
    setMinPrice("");
    setMaxPrice("");
    setSortDraft("createdAt-desc");
    pushParams({
      search: undefined,
      city: undefined,
      countryCode: undefined,
      categoryId: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      priceCurrency: undefined,
      sortBy: undefined,
      sortOrder: undefined,
      page: undefined,
    });
  };

  const categoriesQuery = useQuery({
    queryKey: marketplaceKeys.categories({ isActive: true, locale }),
    queryFn: () => listServiceCategories({ isActive: true }),
  });

  const { data: countries = [] } = useQuery({
    queryKey: locationKeys.countries(true),
    queryFn: () => listCountries({ activeOnly: true }),
  });

  const { data: cities = [] } = useQuery({
    queryKey: locationKeys.cities(countryCode, {
      activeOnly: true,
      featuredOnly: true,
    }),
    queryFn: () =>
      listCitiesByCountryCode(countryCode, {
        activeOnly: true,
        featuredOnly: true,
      }),
    enabled: Boolean(countryCode),
  });

  const categories = categoriesQuery.data ?? [];
  const categoryOptions = categories.map((c) => ({
    label: c.name,
    value: c.id,
  }));
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

  const listParams = {
    page,
    limit: PAGE_SIZE,
    ...(searchFromUrl ? { search: searchFromUrl } : {}),
    ...(categoryIdFromUrl ? { categoryId: categoryIdFromUrl } : {}),
    ...(cityFromUrl ? { city: cityFromUrl } : {}),
    ...(countryCodeFromUrl ? { countryCode: countryCodeFromUrl } : {}),
    ...(minPriceNum != null ? { minPrice: minPriceNum } : {}),
    ...(maxPriceNum != null ? { maxPrice: maxPriceNum } : {}),
    ...(minPriceNum != null || maxPriceNum != null
      ? { priceCurrency: priceCurrencyFromUrl }
      : {}),
    ...(priceBounds.length ? { priceBounds } : {}),
    sortBy,
    sortOrder,
  };

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: marketplaceKeys.publicList({
      ...listParams,
      locale,
      ratesReady: Object.keys(rates).length,
    }),
    queryFn: () => listPublicMarketplaceServices(listParams),
  });

  const services = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;
  const showClearFilters = Boolean(
    searchFromUrl ||
      cityFromUrl ||
      countryCodeFromUrl ||
      categoryIdFromUrl ||
      minPriceFromUrl ||
      maxPriceFromUrl ||
      sortBy !== "createdAt" ||
      sortOrder !== "desc",
  );
  const showRecommendations = !showClearFilters;
  const { showGridDivider } =
    useRecommendedMarketplaceVisible(showRecommendations);
  const tRecommendations = useTranslations("recommendations");

  return (
    <section className="eventslist py-10 pt-24 sm:pt-28">
      <div className="container mx-auto px-4">
        <MarketplaceListingHero
          categoryOptions={categoryOptions}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          loadingCategories={categoriesQuery.isLoading}
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
          onSortChange={(value) => {
            const next = SORT_OPTIONS.find((o) => o.value === value)?.value;
            if (next) setSortDraft(next);
          }}
          onApplyFilters={applyFilters}
          onClearFilters={clearFilters}
          showClearFilters={showClearFilters}
          labels={labels}
        />

        {showRecommendations ? (
          <div className="mb-10">
            <RecommendedMarketplaceSlider />
          </div>
        ) : null}

        <div className="min-w-0 pt-2 sm:pt-4">
          {showGridDivider ? (
            <ListingGridDivider label={tRecommendations("allMarketplace")} />
          ) : null}

          {isError ? (
            <p className="mb-8 py-8 text-sm text-red-400">{t("couldNotLoad")}</p>
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
          ) : services.length === 0 ? (
            <p className="mb-8 py-8 text-sm text-[#B3B3B3]">
              {activeCategory !== ALL_MARKETPLACE_CATEGORIES
                ? t("noServicesInCategory", { category: activeCategoryLabel })
                : t("noServices")}
              {searchFromUrl ? ` ${labels.matching(searchFromUrl)}` : ""}
              {cityFromUrl ? ` ${labels.inCity(cityFromUrl)}` : ""}
            </p>
          ) : (
            <div className="relative mb-8">
              {isFetching && !isLoading ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-[1px]">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : null}
              <ResponsiveEventCardsGrid>
                {services.map((service) => (
                  <MarketplaceServiceCard key={service.id} service={service} />
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
                  ? t("pageOfWithCount", {
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
