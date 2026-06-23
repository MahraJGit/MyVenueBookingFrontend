"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { VenueMarqueeChip } from "@/components/venues/VenueMarqueeChip";
import { listPublicVenues } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import type { PublicVenue } from "@/features/venues/types";

const HOMEPAGE_VENUE_LIMIT = 12;
const MIN_MARQUEE_ITEMS = 4;

function loopForMarquee(venues: PublicVenue[]): PublicVenue[] {
  if (venues.length === 0) return [];

  const expanded = [...venues];
  while (expanded.length < MIN_MARQUEE_ITEMS) {
    expanded.push(...venues);
  }

  return [...expanded, ...expanded];
}

function splitVenueRows(venues: PublicVenue[]) {
  const half = Math.ceil(venues.length / 2);
  return {
    row1: venues.slice(0, half),
    row2: venues.slice(half),
  };
}

function MarqueeRow({
  venues,
  direction,
  className,
}: {
  venues: PublicVenue[];
  direction: "left" | "right";
  className?: string;
}) {
  const looped = loopForMarquee(venues);
  if (looped.length === 0) return null;

  return (
    <div
      className={`wrapper flex gap-3 ${
        direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
      } ${className ?? ""}`}
    >
      {looped.map((venue, index) => (
        <VenueMarqueeChip key={`${venue.id}-${index}`} venue={venue} />
      ))}
    </div>
  );
}

function MarqueeSkeleton({ className }: { className?: string }) {
  return (
    <div className={`wrapper flex gap-3 ${className ?? ""}`}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex h-[83px] w-[280px] shrink-0 animate-pulse items-center gap-3 rounded-[12px] border border-[#303030] bg-[#1A1A1A] p-1"
        >
          <div className="h-[75px] w-[75px] shrink-0 rounded-[10px] bg-[#242424]" />
          <div className="flex flex-1 flex-col gap-2 pr-2">
            <div className="h-3.5 w-3/4 rounded bg-[#242424]" />
            <div className="h-3 w-1/2 rounded bg-[#242424]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function HomeTopVenuesSection() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: venueKeys.publicList({
      page: 1,
      limit: HOMEPAGE_VENUE_LIMIT,
      homepage: true,
    }),
    queryFn: () =>
      listPublicVenues({
        page: 1,
        limit: HOMEPAGE_VENUE_LIMIT,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    staleTime: 5 * 60 * 1000,
  });

  const venues = data?.data ?? [];
  const { row1, row2 } = splitVenueRows(venues);
  const showSecondRow = row2.length > 0;

  return (
    <section className="top-venues relative overflow-hidden py-10">
      <div className="container mx-auto px-4">
        <div className="section-header mb-8 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2>Top Venues</h2>
            <p className="mt-1 text-sm text-[#9A9A9A]">
              Explore banquet halls, lawns, and event spaces for your next
              occasion.
            </p>
          </div>
          <Link
            href="/venues"
            className="shrink-0 rounded-full border border-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:text-primary"
          >
            View More
          </Link>
        </div>
      </div>

      {isError ? (
        <p className="container mx-auto px-4 text-sm text-red-400">
          {error instanceof Error ? error.message : "Could not load venues."}
        </p>
      ) : null}

      {isLoading ? (
        <div className="marquee-container relative -mx-4 overflow-hidden">
          <MarqueeSkeleton className="mb-4" />
          <MarqueeSkeleton />
        </div>
      ) : venues.length === 0 ? (
        <p className="container mx-auto px-4 text-center text-sm text-[#B3B3B3]">
          No venues available yet.{" "}
          <Link href="/venues" className="text-primary hover:underline">
            Browse venues
          </Link>
        </p>
      ) : (
        <div className="marquee-container relative -mx-4 overflow-hidden">
          <MarqueeRow venues={row1} direction="left" className="mb-4" />
          {showSecondRow ? (
            <MarqueeRow venues={row2} direction="right" />
          ) : (
            <MarqueeRow venues={row1} direction="right" />
          )}
        </div>
      )}
    </section>
  );
}
