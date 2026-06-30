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
import { listPublicEventCategories } from "@/features/event-categories/api";
import { listPublicEvents } from "@/features/events/api";
import {
  ALL_EVENTS_CATEGORY,
  categoryQueryValue,
} from "@/features/events/utils";
import {
  useEventSortOptions,
  useListingLabels,
} from "@/features/i18n/use-listing-filters";
import "@/styles/event-list.css";

const PAGE_SIZE = 8;

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
  const sortOptions = useEventSortOptions();
  const labels = useListingLabels();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const categoryFromUrl = searchParams.get("category")?.trim() ?? "";
  const searchFromUrl = searchParams.get("search")?.trim() ?? "";
  const cityFromUrl = searchParams.get("city")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy") ?? "createdAt";
  const sortOrder = searchParams.get("sortOrder") ?? "desc";

  const activeCategory = categoryFromUrl || ALL_EVENTS_CATEGORY;
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

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["public-event-categories"],
    queryFn: listPublicEventCategories,
  });

  const categoryNames = categories.map((c) => c.name);

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
      page,
      categoryFromUrl,
      searchFromUrl,
      cityFromUrl,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      listPublicEvents({
        page,
        limit: PAGE_SIZE,
        search: searchFromUrl || undefined,
        city: cityFromUrl || undefined,
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

        <EventCategoryFilters
          categories={categoryNames}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          isLoading={loadingCategories}
        />

        <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Input
            placeholder={labels.searchEvents}
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
              <Search className="mr-2 h-4 w-4" />
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

        <RecommendedEventsSlider />

        {showGridDivider ? (
          <ListingGridDivider label={tRecommendations("allEvents")} />
        ) : null}

        {isError ? (
          <p className="mb-8 py-8 text-sm text-red-400">
            {error instanceof Error ? error.message : tEvents("couldNotLoadEvents")}
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
        ) : events.length === 0 ? (
          <p className="mb-8 py-8 text-sm text-[#B3B3B3]">
            {activeCategory !== ALL_EVENTS_CATEGORY
              ? tEvents("noEventsInCategory", { category: activeCategory })
              : tEvents("noEventsFound")}
            {searchFromUrl ? labels.matching(searchFromUrl) : ""}
            {cityFromUrl ? labels.inCity(cityFromUrl) : ""}.
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
                ? labels.pageOfWithCount(page, totalPages, data.meta.total, "events")
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
