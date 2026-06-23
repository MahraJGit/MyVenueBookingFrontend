"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { VenuesListingSection } from "@/components/venues/VenuesListingSection";

function VenuesListingFallback() {
  return (
    <section className="eventslist py-10 pt-28">
      <div className="container mx-auto px-4">
        <div className="mb-10 h-10 w-48 animate-pulse rounded bg-[#242424]" />
        <div className="mb-8 flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-9 w-24 animate-pulse rounded-[18px] bg-[#242424]"
            />
          ))}
        </div>
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

export default function VenuesPage() {
  return (
    <Suspense fallback={<VenuesListingFallback />}>
      <VenuesListingSection />
    </Suspense>
  );
}
