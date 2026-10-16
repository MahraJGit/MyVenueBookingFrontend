"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import "@/styles/event-list.css";
import { EventsListingSection } from "@/components/events/EventsListingSection";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";

function EventsListingFallback() {
  const tCommon = useTranslations("common");
  return (
    <section
      className="eventslist public-listing-section"
      aria-busy="true"
      aria-label={tCommon("loading")}
    >
      <div className="container mx-auto px-4">
        <div className="events-listing-hero-wrap relative mb-8 sm:mb-10">
          <div className="events-listing-hero overflow-hidden rounded-2xl border border-[#303030]">
            <div className="events-listing-hero__inner relative space-y-3 px-4 pb-20 pt-8 text-center sm:px-6 sm:pb-24 sm:pt-10">
              <div className="mx-auto h-10 w-64 animate-pulse rounded-lg bg-[#242424]" />
              <div className="mx-auto h-4 w-80 max-w-full animate-pulse rounded bg-[#242424]" />
            </div>
          </div>
          <div className="events-listing-filter-bar relative z-10 mx-auto -mt-16 w-[min(100%,68rem)] px-3 sm:-mt-[4.5rem] sm:px-4 lg:-mt-20">
            <div className="h-56 animate-pulse rounded-2xl border border-[#303030] bg-[#242424] sm:h-64" />
          </div>
        </div>
        <ResponsiveEventCardsGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[420px] animate-pulse rounded-[20px] bg-[#242424]"
            />
          ))}
        </ResponsiveEventCardsGrid>
      </div>
    </section>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsListingFallback />}>
      <EventsListingSection />
    </Suspense>
  );
}
