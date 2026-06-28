"use client";

import { Suspense } from "react";
import { SegmentHubPage } from "@/components/pages/market-segments/SegmentHubPage";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";

function AttractionsFallback() {
  return (
    <section className="eventslist public-listing-section">
      <div className="container mx-auto px-4">
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 h-10 w-full max-w-md animate-pulse rounded bg-[#242424]" />
          <div className="h-5 w-full max-w-lg animate-pulse rounded bg-[#242424]" />
        </div>
        <div className="mb-8 h-48 animate-pulse rounded-2xl bg-[#242424] sm:h-16" />
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

export default function AttractionsPage() {
  return (
    <Suspense fallback={<AttractionsFallback />}>
      <SegmentHubPage variant="attractions" />
    </Suspense>
  );
}
