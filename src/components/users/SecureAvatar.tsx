"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getPresignedViewUrl } from "@/features/uploads/api";
import { cn } from "@/lib/utils";

function isPrivateS3Url(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes(".s3.") && host.endsWith(".amazonaws.com");
  } catch {
    return false;
  }
}

type SecureAvatarProps = {
  avatarUrl: string | null | undefined;
  fallback: ReactNode;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
};

/**
 * Renders user avatars stored on private S3 by resolving a short-lived presigned GET URL.
 * Public URLs (e.g. Unsplash) are used as-is.
 */
export function SecureAvatar({
  avatarUrl,
  fallback,
  className,
  fallbackClassName,
  alt = "",
}: SecureAvatarProps) {
  const trimmed = avatarUrl?.trim() ?? "";
  const needsPresign = trimmed.length > 0 && isPrivateS3Url(trimmed);

  const { data: viewUrl } = useQuery({
    queryKey: ["presigned-avatar", trimmed],
    queryFn: () => getPresignedViewUrl(trimmed),
    enabled: needsPresign,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });

  const src = trimmed ? (needsPresign ? viewUrl : trimmed) : undefined;

  return (
    <Avatar className={cn("shrink-0", className)}>
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      <AvatarFallback className={fallbackClassName}>{fallback}</AvatarFallback>
    </Avatar>
  );
}
