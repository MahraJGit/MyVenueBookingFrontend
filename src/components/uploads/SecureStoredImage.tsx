"use client";

import { useMemo } from "react";
import { getMediaProxyUrl } from "@/features/uploads/media-url";
import { cn } from "@/lib/utils";

type SecureStoredImageProps = {
  src: string;
  alt?: string;
  className?: string;
  /** Optional local blob preview shown immediately after upload. */
  previewSrc?: string;
};

export function SecureStoredImage({
  src,
  alt = "",
  className,
  previewSrc,
}: SecureStoredImageProps) {
  const trimmed = src.trim();
  const resolvedSrc = useMemo(() => {
    if (previewSrc) return previewSrc;
    if (!trimmed) return "";
    if (trimmed.startsWith("blob:")) return trimmed;
    return getMediaProxyUrl(trimmed);
  }, [previewSrc, trimmed]);

  if (!resolvedSrc) {
    return (
      <div
        className={cn(
          "flex min-h-[120px] items-center justify-center bg-muted/30 text-xs text-muted-foreground",
          className,
        )}
      >
        No image
      </div>
    );
  }

  return (
    <div className={cn("relative min-h-[120px] overflow-hidden bg-muted/20", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        className="h-full min-h-[120px] w-full object-cover"
        onError={(e) => {
          const img = e.currentTarget;
          if (previewSrc && img.src !== previewSrc) {
            img.src = previewSrc;
          }
        }}
      />
    </div>
  );
}
