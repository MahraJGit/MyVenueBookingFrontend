"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PublicVenue } from "@/features/venues/types";
import { VenueCoverImage } from "@/components/venues/VenueCoverImage";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { getVenueDisplayPrice } from "@/features/venues/utils";

type VenueCardProps = {
  venue: PublicVenue;
};

export function VenueCard({ venue }: VenueCardProps) {
  const t = useTranslations("venues");
  const priceInfo = getVenueDisplayPrice(venue);
  const location = venue.city || venue.address || "—";

  return (
    <Link
      href={`/venues/${venue.id}`}
      className="card group relative flex h-full cursor-pointer flex-col items-center"
    >
      <VenueCoverImage
        coverImage={venue.coverImage || null}
        venueName={venue.name}
        seed={venue.id}
      />
      <div className="card-body relative z-0 -mt-10 flex w-full max-w-[92%] flex-1 flex-col rounded-2xl border border-[#303030] bg-[#1B1B1B] transition-all duration-300 ease-in-out group-hover:rounded-t-none">
        <div className="flex h-full flex-col gap-4 p-4">
          <h4 className="line-clamp-1">{venue.name}</h4>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs">{venue.venueType?.name || "—"}</span>
            <span className="line-clamp-1 text-right text-xs">{location}</span>
          </div>
          <div className="price text-md mt-auto font-bold text-primary">
            {priceInfo ? (
              <>
                {priceInfo.label}{" "}
                <span>
                  <DisplayPrice amount={priceInfo.price} currency={priceInfo.currency} />
                </span>
              </>
            ) : (
              <span>{t("pricingOnRequest")}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
