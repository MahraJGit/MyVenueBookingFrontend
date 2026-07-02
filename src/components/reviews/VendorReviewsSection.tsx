"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { getVendorReviews, getVendorReviewSummary } from "@/features/reviews/api";
import { ReviewsList, StarsDisplay } from "@/components/reviews/ReviewsList";

const REVIEWS_PAGE_SIZE = 10;

type VendorReviewsSectionProps = {
  vendorId: string;
};

export function VendorReviewsSection({ vendorId }: VendorReviewsSectionProps) {
  const t = useTranslations("reviews");

  const { data: summary } = useQuery({
    queryKey: ["vendor-review-summary", vendorId],
    queryFn: () => getVendorReviewSummary(vendorId),
  });

  const {
    data: reviewsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ["vendor-reviews", vendorId],
    queryFn: ({ pageParam }) => getVendorReviews(vendorId, pageParam, REVIEWS_PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages
        ? lastPage.meta.page + 1
        : undefined,
    enabled: (summary?.count ?? 0) > 0,
  });

  if (summary === undefined) {
    return (
      <div>
        <h2 className="mb-6 text-xl font-bold text-primary sm:text-2xl">
          {t("vendorSectionTitle")}
        </h2>
        <p className="text-sm text-zinc-500">{t("loadingReviews")}</p>
      </div>
    );
  }

  const reviews = reviewsPages?.pages.flatMap((page) => page.data) ?? [];
  const totalCount = reviewsPages?.pages[0]?.meta.total ?? summary.count;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-bold text-primary sm:text-2xl">{t("vendorSectionTitle")}</h2>
        {summary.count > 0 && summary.averageRating != null ? (
          <div className="flex items-center gap-2 text-sm text-zinc-300">
            <StarsDisplay rating={summary.averageRating} />
            <span className="font-semibold text-white">{summary.averageRating}</span>
            <span className="text-zinc-500">
              {t("reviewCount", { count: summary.count })}
            </span>
          </div>
        ) : (
          <span className="text-sm text-zinc-500">{t("noReviewsYet")}</span>
        )}
      </div>

      {summary.count > 0 ? (
        <ReviewsList
          reviews={reviews}
          totalCount={totalCount}
          hasMore={Boolean(hasNextPage)}
          isLoading={isLoading}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={() => void fetchNextPage()}
        />
      ) : null}
    </div>
  );
}
