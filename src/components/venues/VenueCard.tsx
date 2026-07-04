"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PublicVenue } from "@/features/venues/types";
import { VenueCoverImage } from "@/components/venues/VenueCoverImage";
import { DisplayPrice } from "@/components/currency/DisplayPrice";
import { getVenueDisplayPrice } from "@/features/venues/utils";
import { useVenuePriceLabels } from "@/features/i18n/use-venue-price-labels";
import { FavoriteButton } from "@/components/favorites/FavoriteButton";

type VenueCardProps = {
  venue: PublicVenue;
};

export function VenueCard({ venue }: VenueCardProps) {
  const t = useTranslations("venues");
  const priceLabels = useVenuePriceLabels();
  const priceInfo = getVenueDisplayPrice(venue, priceLabels);
  const location = venue.city || venue.address || "—";

  return (
    <div className="card group relative flex h-full flex-col items-center">
      <FavoriteButton
        type="venue"
        id={venue.id}
        className="absolute top-3 right-3 z-20"
      />
      <Link
        href={`/venues/${venue.id}`}
        className="relative flex h-full w-full cursor-pointer flex-col items-center"
      >
      <VenueCoverImage
        coverImage={venue.coverImage || null}
        venueName={venue.name}
        seed={venue.id}
      />
      <div className="card-body relative z-0 -mt-10 flex w-full max-w-[92%] flex-1 flex-col rounded-2xl border border-[#303030] bg-[#1B1B1B] transition-all duration-300 ease-in-out group-hover:rounded-t-none">
        <div className="flex h-full flex-col gap-4 p-4">
          <h4 className="line-clamp-1" dir="auto">
            {venue.name}
          </h4>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs" dir="auto">
              {venue.venueType?.name || "—"}
            </span>
            <span className="line-clamp-1 text-end text-xs" dir="auto">
              {location}
            </span>
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
    </div>
  );
}
