"use client";

import { Suspense } from "react";
import "@/styles/event-list.css";
import { EventsListingSection } from "@/components/events/EventsListingSection";

function EventsListingFallback() {
  return (
    <section className="eventslist py-10">
      <div className="container mx-auto px-4">
        <div className="h-10 w-48 bg-[#242424] animate-pulse rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[420px] rounded-[20px] bg-[#242424] animate-pulse"
            />
          ))}
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
