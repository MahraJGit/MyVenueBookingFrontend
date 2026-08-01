"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { MarketplaceServiceCard } from "@/components/marketplace/MarketplaceServiceCard";
import {
  ALL_MARKETPLACE_CATEGORIES,
  MarketplaceCategoryFilters,
} from "@/components/marketplace/MarketplaceCategoryFilters";
import { MarketplacePageHeader } from "@/components/marketplace/MarketplacePageHeader";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listPublicMarketplaceServices,
  listServiceCategories,
} from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import type { ServicePricingModel } from "@/features/marketplace/types";
import { listCitiesByCountryCode, listCountries } from "@/features/locations/api";
import { locationKeys } from "@/features/locations/query-keys";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { useListingLabels } from "@/features/i18n/use-listing-filters";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;
const LISTING_GRID_CLASS = "mb-8";
const LISTING_THREE_COL_GRID = { maxThreeColumns: true as const };

const SORT_OPTIONS = [
  { value: "createdAt-desc", sortBy: "createdAt", sortOrder: "desc" },
  { value: "createdAt-asc", sortBy: "createdAt", sortOrder: "asc" },
  { value: "title-asc", sortBy: "title", sortOrder: "asc" },
  { value: "title-desc", sortBy: "title", sortOrder: "desc" },
  { value: "basePrice-asc", sortBy: "basePrice", sortOrder: "asc" },
  { value: "basePrice-desc", sortBy: "basePrice", sortOrder: "desc" },
] as const;

export function MarketplaceListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("marketplace");
  const tCommon = useTranslations("common");
  const { locale } = useLocaleContext();
  const labels = useListingLabels();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const categoryIdFromUrl = searchParams.get("categoryId")?.trim() ?? "";
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const countryCodeFromUrl = searchParams.get("countryCode")?.trim() ?? "";
  const pricingModelFromUrl =
    (searchParams.get("pricingModel")?.trim() as ServicePricingModel | "") || "";
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
      const href = qs ? `/marketplace?${qs}` : "/marketplace";
      if (replace) router.replace(href, { scroll: false });
      else router.push(href);
    },
    [router, searchParams],
  );

  const handleCategoryChange = useCallback(
    (categoryId: string) => {
      pushParams(
        {
          categoryId:
            categoryId === ALL_MARKETPLACE_CATEGORIES ? undefined : categoryId,
          page: undefined,
        },
        true,
      );
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
    const option = SORT_OPTIONS.find((o) => o.value === value);
    if (!option) return;
    const isDefault =
      option.sortBy === "createdAt" && option.sortOrder === "desc";
    pushParams({
      sortBy: isDefault ? undefined : option.sortBy,
      sortOrder: isDefault ? undefined : option.sortOrder,
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

  const listParams = {
    page,
    limit: PAGE_SIZE,
    ...(searchFromUrl ? { search: searchFromUrl } : {}),
    ...(categoryIdFromUrl ? { categoryId: categoryIdFromUrl } : {}),
    ...(cityFromUrl ? { city: cityFromUrl } : {}),
    ...(countryCodeFromUrl ? { countryCode: countryCodeFromUrl } : {}),
    ...(pricingModelFromUrl
      ? { pricingModel: pricingModelFromUrl as ServicePricingModel }
      : {}),
    sortBy,
    sortOrder,
  };

  const {
    data,
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: marketplaceKeys.publicList({ ...listParams, locale }),
    queryFn: () => listPublicMarketplaceServices(listParams),
  });

  const services = data?.data ?? [];
  const totalPages = data?.meta.totalPages ?? 1;
  const showPagination = !isLoading && totalPages > 1;
  const hasActiveFilters = Boolean(
    searchFromUrl || cityFromUrl || countryCodeFromUrl || pricingModelFromUrl,
  );

  return (
    <section className="eventslist py-10 pt-24 sm:pt-28">
      <div className="container mx-auto px-4">
        <MarketplacePageHeader />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:items-start lg:gap-10">
          <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-1">
            <div>
              <h2 className="mb-3 text-sm font-medium text-white">
                {t("category")}
              </h2>
              <MarketplaceCategoryFilters
                categories={categoryOptions}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
                isLoading={categoriesQuery.isLoading}
              />
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4">
              <h2 className="text-sm font-medium text-white">{tCommon("filter")}</h2>
              <Input
                placeholder={t("searchPlaceholder")}
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
              <Select
                value={pricingModelFromUrl || "ALL"}
                onValueChange={(v) =>
                  pushParams(
                    {
                      pricingModel: v === "ALL" ? undefined : v,
                      page: undefined,
                    },
                    true,
                  )
                }
              >
                <SelectTrigger className="w-full border-[#303030] bg-black text-white">
                  <SelectValue placeholder={t("allPricing")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t("allPricing")}</SelectItem>
                  <SelectItem value="FLAT_PER_EVENT">{t("modelFlat")}</SelectItem>
                  <SelectItem value="HOURLY">{t("modelHourly")}</SelectItem>
                  <SelectItem value="PER_GUEST">{t("modelPerGuest")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortValue} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full border-[#303030] bg-black text-white hover:bg-black dark:hover:bg-black data-[state=open]:border-ring data-[state=open]:ring-ring/50 data-[state=open]:ring-[3px]">
                  <SelectValue placeholder={labels.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">{t("sortNewest")}</SelectItem>
                  <SelectItem value="createdAt-asc">{t("sortOldest")}</SelectItem>
                  <SelectItem value="title-asc">{t("sortTitleAsc")}</SelectItem>
                  <SelectItem value="title-desc">{t("sortTitleDesc")}</SelectItem>
                  <SelectItem value="basePrice-asc">{t("sortPriceAsc")}</SelectItem>
                  <SelectItem value="basePrice-desc">{t("sortPriceDesc")}</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={applyFilters} className="w-full bg-primary">
                <Search className="me-2 h-4 w-4" />
                {labels.search}
              </Button>
              {hasActiveFilters ? (
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
                      pricingModel: undefined,
                      page: undefined,
                    });
                  }}
                >
                  {labels.clearFilters}
                </Button>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0 lg:col-span-3">
            {isError ? (
              <p className="mb-8 py-8 text-sm text-red-400">{t("couldNotLoad")}</p>
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
                <ResponsiveEventCardsGrid {...LISTING_THREE_COL_GRID}>
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
      </div>
    </section>
  );
}
