"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { AttractionCard } from "@/components/attractions/AttractionCard";
import {
  RecommendationCarouselItem,
  RecommendationsCarousel,
  RecommendationsPanelSkeleton,
} from "@/components/recommendations/RecommendationsCarousel";
import { useAuth } from "@/features/auth/auth-context";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { RECOMMENDATION_SLIDER_LIMIT } from "@/features/recommendations/constants";
import { getRecommendedAttractions } from "@/features/recommendations/api";
import { recommendationKeys } from "@/features/recommendations/query-keys";

export function RecommendedAttractionsSlider() {
  const t = useTranslations("recommendations");
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data, isLoading } = useQuery({
    queryKey: recommendationKeys.attractions(RECOMMENDATION_SLIDER_LIMIT, locale),
    queryFn: () => getRecommendedAttractions(RECOMMENDATION_SLIDER_LIMIT),
    enabled: isAuthenticated && isReady,
    staleTime: 5 * 60 * 1000,
  });

  if (!isAuthenticated || !isReady) return null;

  if (isLoading) {
    return (
      <RecommendationsPanelSkeleton
        title={t("attractionsTitle")}
        subtitle={t("attractionsSubtitle")}
      />
    );
  }

  if (!data?.length) return null;

  return (
    <RecommendationsCarousel
      title={t("attractionsTitle")}
      subtitle={t("attractionsSubtitle")}
    >
      {data.map((attraction) => (
        <RecommendationCarouselItem key={attraction.id}>
          <AttractionCard attraction={attraction} />
        </RecommendationCarouselItem>
      ))}
    </RecommendationsCarousel>
  );
}

export function useRecommendedAttractionsVisible() {
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data, isLoading } = useQuery({
    queryKey: recommendationKeys.attractions(RECOMMENDATION_SLIDER_LIMIT, locale),
    queryFn: () => getRecommendedAttractions(RECOMMENDATION_SLIDER_LIMIT),
    enabled: isAuthenticated && isReady,
    staleTime: 5 * 60 * 1000,
  });

  return {
    showGridDivider: Boolean(
      isAuthenticated && isReady && (isLoading || (data?.length ?? 0) > 0),
    ),
  };
}
