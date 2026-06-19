"use client";

import Image from "next/image";
import { useState } from "react";
import { getFallbackVenueImage } from "@/features/venues/utils";

type VenueCoverImageProps = {
  coverImage: string | null;
  venueName: string;
  seed: string;
  className?: string;
};

export function VenueCoverImage({
  coverImage,
  venueName,
  seed,
  className,
}: VenueCoverImageProps) {
  const fallback = getFallbackVenueImage(seed);
  const resolved = coverImage?.trim() || fallback;
  const [src, setSrc] = useState(resolved);

  return (
    <Image
      src={src}
      alt={venueName}
      width={500}
      height={343}
      onError={() => setSrc(fallback)}
      className={className ?? "h-[343px]! w-full rounded-[20px] object-cover"}
    />
  );
}
