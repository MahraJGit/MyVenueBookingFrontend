"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { EventCard } from "@/components/events/EventCard";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
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
  const tHome = useTranslations("home");
  const tEvents = useTranslations("events");
  const tCommon = useTranslations("common");

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
          <h2>{tHome("hotEvents")}</h2>
          <Link href={seeAllHref} className="text-white font-semibold border border-primary rounded-full px-4 py-2 text-sm hover:text-primary transition-colors">
            {tCommon("seeAll")}
          </Link>
        </div>

        {/* <EventCategoryFilters
          categories={categoryNames}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          isLoading={loadingCategories}
        /> */}

        {isError ? (
          <p className="text-sm text-red-400 py-8">
            {error instanceof Error ? error.message : tHome("couldNotLoadEvents")}
          </p>
        ) : null}

        {loadingEvents ? (
          <ResponsiveEventCardsGrid>
            {Array.from({ length: HOMEPAGE_EVENT_LIMIT }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] rounded-[20px] bg-[#242424] animate-pulse"
              />
            ))}
          </ResponsiveEventCardsGrid>
        ) : events.length === 0 ? (
          <p className="text-sm text-[#B3B3B3] py-8">
            {activeCategory !== ALL_EVENTS_CATEGORY
              ? tEvents("noEventsInCategory", { category: activeCategory })
              : tEvents("noEventsFound")}
            .
          </p>
        ) : (
          <ResponsiveEventCardsGrid>
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </ResponsiveEventCardsGrid>
        )}
      </div>
    </section>
  );
}
