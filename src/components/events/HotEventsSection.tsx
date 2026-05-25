"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EventCard } from "@/components/events/EventCard";
import { EventCategoryFilters } from "@/components/events/EventCategoryFilters";
import { listPublicEventCategories } from "@/features/event-categories/api";
import { listPublicEvents } from "@/features/events/api";
import {
  ALL_EVENTS_CATEGORY,
  buildEventsPageHref,
  categoryQueryValue,
} from "@/features/events/utils";

const HOMEPAGE_EVENT_LIMIT = 4;

export function HotEventsSection() {
  const [activeCategory, setActiveCategory] = useState(ALL_EVENTS_CATEGORY);

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ["public-event-categories"],
    queryFn: listPublicEventCategories,
  });

  const categoryNames = categories.map((c) => c.name);

  const {
    data: eventsResult,
    isLoading: loadingEvents,
    isError,
    error,
  } = useQuery({
    queryKey: ["public-events", "homepage", activeCategory],
    queryFn: () =>
      listPublicEvents({
        page: 1,
        limit: HOMEPAGE_EVENT_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...(categoryQueryValue(activeCategory)
          ? { category: categoryQueryValue(activeCategory) }
          : {}),
      }),
  });

  const events = eventsResult?.data ?? [];
  const seeAllHref = buildEventsPageHref(activeCategory);

  return (
    <section className="shows py-10">
      <div className="container mx-auto px-4">
        <div className="section-header py-5 mb-6 flex items-center justify-between border-b border-[#1F1F1F]">
          <h2>Hot Events</h2>
          <Link href={seeAllHref} className="text-sm hover:text-primary transition-colors">
            See all
          </Link>
        </div>

        <EventCategoryFilters
          categories={categoryNames}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          isLoading={loadingCategories}
        />

        {isError ? (
          <p className="text-sm text-red-400 py-8">
            {error instanceof Error ? error.message : "Could not load events."}
          </p>
        ) : null}

        {loadingEvents ? (
          <div className="shows-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: HOMEPAGE_EVENT_LIMIT }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] rounded-[20px] bg-[#242424] animate-pulse"
              />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-sm text-[#B3B3B3] py-8">
            No events found
            {activeCategory !== ALL_EVENTS_CATEGORY ? ` in ${activeCategory}` : ""}.
          </p>
        ) : (
          <div className="shows-cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
