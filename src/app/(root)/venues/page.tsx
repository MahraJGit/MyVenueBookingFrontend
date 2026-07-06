"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { VenuesListingSection } from "@/components/venues/VenuesListingSection";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";

function VenuesListingFallback() {
  const tCommon = useTranslations("common");
  const t = useTranslations("venuesListing");

  return (
    <section
      className="eventslist public-listing-section"
      aria-busy="true"
      aria-label={tCommon("loading")}
    >
      <div className="container mx-auto px-4">
        <div className="mb-10 max-w-3xl">
          <div className="mb-3 h-10 w-full max-w-md animate-pulse rounded bg-[#242424]" />
          <div className="h-5 w-full max-w-lg animate-pulse rounded bg-[#242424]" />
          <span className="sr-only">
            {t("title")} {t("titleHighlight")}
          </span>
        </div>
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

export default function VenuesPage() {
  return (
    <Suspense fallback={<VenuesListingFallback />}>
      <VenuesListingSection />
    </Suspense>
  );
}
