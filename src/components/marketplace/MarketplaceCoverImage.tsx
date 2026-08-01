"use client";

import { useState } from "react";
import { getFallbackEventImage } from "@/features/events/utils";
import { getMediaProxyUrl } from "@/features/uploads/media-url";

type MarketplaceCoverImageProps = {
  coverImage?: string | null;
  serviceTitle: string;
  seed: string;
  className?: string;
};

export function MarketplaceCoverImage({
  coverImage,
  serviceTitle,
  seed,
  className,
}: MarketplaceCoverImageProps) {
  const fallback = getFallbackEventImage(seed);
  const resolved = coverImage?.trim()
    ? getMediaProxyUrl(coverImage.trim())
    : fallback;
  const [src, setSrc] = useState(resolved);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={serviceTitle}
      onError={() => setSrc(fallback)}
      className={
        className ?? "h-[343px]! w-full rounded-[20px] object-cover"
      }
    />
  );
}
