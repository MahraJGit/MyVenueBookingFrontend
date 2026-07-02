"use client";

import { useEffect, useRef } from "react";

type UseIntersectionLoadMoreOptions = {
  enabled: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
};

export function useIntersectionLoadMore({
  enabled,
  isLoading,
  onLoadMore,
  rootMargin = "240px",
}: UseIntersectionLoadMoreOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    if (!enabled || isLoading) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMoreRef.current();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, isLoading, rootMargin]);

  return sentinelRef;
}
