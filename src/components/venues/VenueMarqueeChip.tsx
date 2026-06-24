"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicVenue } from "@/features/venues/types";
import { getFallbackVenueImage } from "@/features/venues/utils";

type VenueMarqueeChipProps = {
  venue: PublicVenue;
};

export function VenueMarqueeChip({ venue }: VenueMarqueeChipProps) {
  const t = useTranslations("venues");
  const fallback = getFallbackVenueImage(venue.id);
  const initial = venue.coverImage?.trim() || fallback;
  const [src, setSrc] = useState(initial);

  const subtitle =
    [venue.city, venue.venueType?.name].filter(Boolean).join(" · ") ||
    t("venueLabel");

  return (
    <Link
      href={`/venues/${venue.id}`}
      className="card flex w-[280px] shrink-0 items-center gap-3 rounded-[12px] border border-[#303030] bg-[#1A1A1A] p-1 transition-colors hover:border-[#D7498E]/40"
    >
      <Image
        src={src}
        alt={venue.name}
        width={75}
        height={75}
        onError={() => setSrc(fallback)}
        className="h-[75px] w-[75px] shrink-0 rounded-[10px] object-cover"
      />
      <div className="detail min-w-0 pr-2">
        <h5 className="mb-1 line-clamp-1 text-sm font-medium text-white">
          {venue.name}
        </h5>
        <p className="line-clamp-1 text-xs text-[#9A9A9A]">{subtitle}</p>
      </div>
    </Link>
  );
}
