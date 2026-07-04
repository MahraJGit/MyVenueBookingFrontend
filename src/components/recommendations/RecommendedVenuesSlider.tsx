"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  RecommendationCarouselItem,
  RecommendationsCarousel,
  RecommendationsPanelSkeleton,
} from "@/components/recommendations/RecommendationsCarousel";
import { VenueCard } from "@/components/venues/VenueCard";
import { useAuth } from "@/features/auth/auth-context";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { RECOMMENDATION_SLIDER_LIMIT } from "@/features/recommendations/constants";
import { getRecommendedVenues } from "@/features/recommendations/api";
import { recommendationKeys } from "@/features/recommendations/query-keys";

export function RecommendedVenuesSlider() {
  const t = useTranslations("recommendations");
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data, isLoading } = useQuery({
    queryKey: recommendationKeys.venues(RECOMMENDATION_SLIDER_LIMIT, locale),
    queryFn: () => getRecommendedVenues(RECOMMENDATION_SLIDER_LIMIT),
    enabled: isAuthenticated && isReady,
    staleTime: 5 * 60 * 1000,
  });

  if (!isAuthenticated || !isReady) return null;

  if (isLoading) {
    return (
      <RecommendationsPanelSkeleton
        title={t("venuesTitle")}
        subtitle={t("venuesSubtitle")}
      />
    );
  }

  if (!data?.length) return null;

  return (
    <RecommendationsCarousel title={t("venuesTitle")} subtitle={t("venuesSubtitle")}>
      {data.map((venue) => (
        <RecommendationCarouselItem key={venue.id}>
          <VenueCard venue={venue} />
        </RecommendationCarouselItem>
      ))}
    </RecommendationsCarousel>
  );
}

export function useRecommendedVenuesVisible() {
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data, isLoading } = useQuery({
    queryKey: recommendationKeys.venues(RECOMMENDATION_SLIDER_LIMIT, locale),
    queryFn: () => getRecommendedVenues(RECOMMENDATION_SLIDER_LIMIT),
    enabled: isAuthenticated && isReady,
    staleTime: 5 * 60 * 1000,
  });

  return {
    showGridDivider: Boolean(
      isAuthenticated && isReady && (isLoading || (data?.length ?? 0) > 0),
    ),
  };
}
