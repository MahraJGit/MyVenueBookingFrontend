"use client";

import Link from "next/link";
import Image from "next/image";
import type { PublicVenue } from "@/features/venues/types";
import {
  formatVenuePrice,
  getFallbackVenueImage,
  getVenueDisplayPrice,
} from "@/features/venues/utils";

type VenueCardProps = {
  venue: PublicVenue;
};

export function VenueCard({ venue }: VenueCardProps) {
  const imageSrc = venue.coverImage || getFallbackVenueImage(venue.id);
  const priceInfo = getVenueDisplayPrice(venue);
  const location = [venue.city, venue.address].filter(Boolean).join(" · ");
  const capacity =
    venue.capacityMin && venue.capacityMax
      ? `${venue.capacityMin}–${venue.capacityMax} guests`
      : venue.capacityMax
        ? `Up to ${venue.capacityMax} guests`
        : null;

  return (
    <Link
      href={`/venues/${venue.id}`}
      className="card group relative flex cursor-pointer flex-col items-center"
    >
      <div className="relative h-48 w-full overflow-hidden rounded-2xl">
        <Image
          src={imageSrc}
          alt={venue.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="card-body relative z-0 -mt-10 w-full max-w-[92%] rounded-2xl border border-[#303030] bg-[#1B1B1B] transition-all duration-300 ease-in-out group-hover:rounded-t-none">
        <div className="flex flex-col gap-3 p-4">
          <h4 className="line-clamp-1">{venue.name}</h4>
          {venue.venueType?.name && (
            <span className="text-xs text-muted-foreground">{venue.venueType.name}</span>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="line-clamp-1">{location || "—"}</span>
            {capacity && <span>{capacity}</span>}
          </div>
          <div className="price text-md font-bold text-primary">
            {priceInfo ? (
              <>
                {priceInfo.label}{" "}
                <span>{formatVenuePrice(priceInfo.price, priceInfo.currency)}</span>
              </>
            ) : (
              <span>Pricing on request</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
