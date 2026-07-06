"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import "@/styles/event-list.css";
import { EventsListingSection } from "@/components/events/EventsListingSection";
import { EventsPageHeader } from "@/components/events/EventsPageHeader";
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
        <EventsPageHeader />
        <div className="mb-10 h-48 animate-pulse rounded-2xl bg-[#242424]" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-10">
          <aside className="space-y-6 lg:col-span-1">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-24 animate-pulse rounded-[18px] bg-[#242424]"
                />
              ))}
            </div>
            <div className="h-64 animate-pulse rounded-2xl bg-[#242424]" />
          </aside>
          <ResponsiveEventCardsGrid className="lg:col-span-3" maxThreeColumns>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-[20px] bg-[#242424]"
              />
            ))}
          </ResponsiveEventCardsGrid>
        </div>
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
