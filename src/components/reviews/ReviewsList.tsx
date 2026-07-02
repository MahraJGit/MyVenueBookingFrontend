"use client";

import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { useIntersectionLoadMore } from "@/hooks/use-intersection-load-more";
import { cn } from "@/lib/utils";

export type ReviewListItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
  };
};

function StarsDisplay({ rating, className }: { rating: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              filled ? "fill-primary text-primary" : "text-zinc-600",
            )}
          />
        );
      })}
    </div>
  );
}

type ReviewsListProps = {
  reviews: ReviewListItem[];
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

export function ReviewsList({
  reviews,
  totalCount,
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
}: ReviewsListProps) {
  const t = useTranslations("reviews");

  const sentinelRef = useIntersectionLoadMore({
    enabled: hasMore,
    isLoading: isLoading || isLoadingMore,
    onLoadMore,
  });

  if (isLoading) {
    return <p className="text-sm text-zinc-500">{t("loadingReviews")}</p>;
  }

  if (reviews.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-500">
        {t("showingReviews", { shown: reviews.length, total: totalCount })}
      </p>

      <ul className="space-y-4">
        {reviews.map((review) => (
          <li
            key={review.id}
            className="rounded-2xl border border-[#303030] bg-[#1B1B1B] p-4"
          >
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-white">{review.reviewer.name}</p>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <StarsDisplay rating={review.rating} />
                <time dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
              </div>
            </div>
            {review.comment ? (
              <p className="text-sm leading-relaxed text-zinc-300">{review.comment}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {hasMore ? (
        <div
          ref={sentinelRef}
          className="flex min-h-10 items-center justify-center py-2"
          aria-hidden={!isLoadingMore}
        >
          {isLoadingMore ? (
            <p className="text-sm text-zinc-500">{t("loadingMoreReviews")}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { StarsDisplay };
