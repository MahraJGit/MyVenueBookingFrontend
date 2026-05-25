"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/events/EventCard";
import { EventCategoryFilters } from "@/components/events/EventCategoryFilters";
import { listPublicEventCategories } from "@/features/event-categories/api";
import { listPublicEvents } from "@/features/events/api";
import {
  ALL_EVENTS_CATEGORY,
  categoryQueryValue,
} from "@/features/events/utils";

const PAGE_SIZE = 12;

export function EventsListingSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const [activeCategory, setActiveCategory] = useState(
    categoryFromUrl?.trim() || ALL_EVENTS_CATEGORY,
  );

  useEffect(() => {
    const next = categoryFromUrl?.trim() || ALL_EVENTS_CATEGORY;
    setActiveCategory(next);
  }, [categoryFromUrl]);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["public-event-categories"],
    queryFn: listPublicEventCategories,
  });

  const categoryNames = categories.map((c) => c.name);

  const handleCategoryChange = useCallback(
    (category: string) => {
      setActiveCategory(category);
      const value = categoryQueryValue(category);
      if (value) {
        router.replace(`/events?category=${encodeURIComponent(value)}`, {
          scroll: false,
        });
      } else {
        router.replace("/events", { scroll: false });
      }
    },
    [router],
  );

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["public-events", "listing", activeCategory],
    queryFn: ({ pageParam }) =>
      listPublicEvents({
        page: pageParam,
        limit: PAGE_SIZE,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...(categoryQueryValue(activeCategory)
          ? { category: categoryQueryValue(activeCategory) }
          : {}),
      }),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });

  const events = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <section className="eventslist py-10">
      <div className="container mx-auto px-4">
        <div className="section-header py-5 mb-6 flex items-center justify-between border-b border-[#1F1F1F]">
          <h2>All Events</h2>
        </div>

        <EventCategoryFilters
          categories={categoryNames}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          isLoading={loadingCategories}
        />

        {isError ? (
          <p className="text-sm text-red-400 py-8 mb-8">
            {error instanceof Error ? error.message : "Could not load events."}
          </p>
        ) : null}

        {isLoading ? (
          <div className="event-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] rounded-[20px] bg-[#242424] animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-[#B3B3B3] py-8 mb-8">
            No events found
            {activeCategory !== ALL_EVENTS_CATEGORY ? ` in ${activeCategory}` : ""}.
          </p>
        ) : (
          <div className="event-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        {hasNextPage ? (
          <div className="flex justify-center">
            <Button
              variant="default"
              size="lg"
              className="cursor-pointer"
              disabled={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              {isFetchingNextPage ? "Loading…" : "Load more events"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
