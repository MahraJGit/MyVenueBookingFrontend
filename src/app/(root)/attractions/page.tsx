"use client";

import { Suspense } from "react";
import { SegmentHubPage } from "@/components/pages/market-segments/SegmentHubPage";

function AttractionsFallback() {
  return (
    <section className="eventslist py-10 pt-28">
      <div className="container mx-auto px-4">
        <div className="mb-10 h-10 w-64 animate-pulse rounded bg-[#242424]" />
        <div className="mb-8 h-16 animate-pulse rounded-2xl bg-[#242424]" />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-[420px] animate-pulse rounded-[20px] bg-[#242424]"
            />
          ))}
        </div>
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
