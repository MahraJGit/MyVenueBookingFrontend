"use client";

import Image from "next/image";
import { useState } from "react";
import { getFallbackEventImage } from "@/features/events/utils";

type EventCoverImageProps = {
  coverImage: string | null;
  thumbnail: string | null;
  eventName: string;
  seed: string;
  className?: string;
};

export function EventCoverImage({
  coverImage,
  thumbnail,
  eventName,
  seed,
  className,
}: EventCoverImageProps) {
  const fallback = getFallbackEventImage(seed);
  const resolved = thumbnail?.trim() || coverImage?.trim() || fallback;
  const [src, setSrc] = useState(resolved);

  return (
    <Image
      src={src}
      alt={eventName}
      width={500}
      height={343}
      onError={() => setSrc(fallback)}
      className={className ?? "rounded-[20px] object-cover h-[343px]! w-full"}
    />
  );
}
