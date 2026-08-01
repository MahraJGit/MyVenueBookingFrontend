"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AUTH_CHANGED_EVENT,
  getAccessToken,
} from "@/features/auth/session-storage";
import { getMediaProxyUrl } from "@/features/uploads/media-url";
import { isPrivateS3Url } from "@/features/uploads/s3-url";
import { authFetch } from "@/lib/api/auth-fetch";
import { cn } from "@/lib/utils";

type SecureStoredImageProps = {
  src: string;
  alt?: string;
  className?: string;
  /** Optional local blob preview shown immediately after upload. */
  previewSrc?: string;
};

/**
 * Renders stored media URLs. Private S3 objects are loaded with the session
 * Bearer token when available (dashboard uploads), otherwise via /api/media.
 */
export function SecureStoredImage({
  src,
  alt = "",
  className,
  previewSrc,
}: SecureStoredImageProps) {
  const trimmed = src.trim();
  const [hasSession, setHasSession] = useState(false);
  const [authedBlobSrc, setAuthedBlobSrc] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setHasSession(Boolean(getAccessToken()));
    sync();
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, sync);
  }, []);

  const needsAuthedFetch =
    !previewSrc &&
    Boolean(trimmed) &&
    !trimmed.startsWith("blob:") &&
    isPrivateS3Url(trimmed) &&
    hasSession;

  useEffect(() => {
    if (!needsAuthedFetch) {
      setAuthedBlobSrc(null);
      return;
    }

    let cancelled = false;
    let objectUrl: string | null = null;

    void (async () => {
      try {
        const res = await authFetch(
          `/api/uploads/image?url=${encodeURIComponent(trimmed)}`,
          { networkErrorMessage: "Could not load image." },
        );
        if (!res.ok || cancelled) return;
        const blob = await res.blob();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        setAuthedBlobSrc(objectUrl);
      } catch {
        if (!cancelled) setAuthedBlobSrc(null);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [needsAuthedFetch, trimmed]);

  const resolvedSrc = useMemo(() => {
    if (previewSrc) return previewSrc;
    if (!trimmed) return "";
    if (trimmed.startsWith("blob:")) return trimmed;
    if (authedBlobSrc) return authedBlobSrc;
    // While authed fetch is in flight, avoid flapping through /api/media (401).
    if (needsAuthedFetch) return "";
    return getMediaProxyUrl(trimmed);
  }, [previewSrc, trimmed, authedBlobSrc, needsAuthedFetch]);

  if (!resolvedSrc) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted/30 text-xs text-muted-foreground",
          className,
        )}
      >
        No image
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-muted/20", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        className="h-full w-full object-cover"
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
