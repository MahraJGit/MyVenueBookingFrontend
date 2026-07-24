"use client";

import Image from "next/image";
import { useState } from "react";
import { getFallbackEventImage } from "@/features/events/utils";

type AttractionCoverImageProps = {
  coverImage: string | null;
  thumbnail: string | null;
  attractionName: string;
  seed: string;
  className?: string;
};

export function AttractionCoverImage({
  coverImage,
  thumbnail,
  attractionName,
  seed,
  className,
}: AttractionCoverImageProps) {
  const fallback = getFallbackEventImage(seed);
  const resolved = thumbnail?.trim() || coverImage?.trim() || fallback;
  const [src, setSrc] = useState(resolved);

  return (
    <Image
      src={src}
      alt={attractionName}
      width={500}
      height={343}
      onError={() => setSrc(fallback)}
      className={className ?? "rounded-[20px] object-cover h-[343px]! w-full"}
    />
  );
}
