"use client";

import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getVenueReviews, getVenueReviewSummary } from "@/features/reviews/api";
import { cn } from "@/lib/utils";

type VenueReviewsSectionProps = {
  venueId: string;
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

export function VenueReviewsSection({ venueId }: VenueReviewsSectionProps) {
  const t = useTranslations("reviews");

  const { data: summary } = useQuery({
    queryKey: ["venue-review-summary", venueId],
    queryFn: () => getVenueReviewSummary(venueId),
  });

  const { data: reviewsResult, isLoading } = useQuery({
    queryKey: ["venue-reviews", venueId],
    queryFn: () => getVenueReviews(venueId),
    enabled: (summary?.count ?? 0) > 0,
  });

  if (!summary || summary.count === 0) {
    return null;
  }

  const reviews = reviewsResult?.data ?? [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 sm:mb-4">
        <h2 className="text-lg font-bold text-primary sm:text-xl">{t("venueSectionTitle")}</h2>
        {summary.averageRating != null ? (
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <StarsDisplay rating={summary.averageRating} />
            <span className="font-semibold text-white">{summary.averageRating}</span>
            <span className="text-zinc-500">
              {t("reviewCount", { count: summary.count })}
            </span>
          </div>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-500">{t("loadingReviews")}</p>
      ) : (
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
      )}
    </div>
  );
}
