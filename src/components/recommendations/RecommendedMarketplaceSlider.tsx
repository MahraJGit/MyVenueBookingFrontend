"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { MarketplaceServiceCard } from "@/components/marketplace/MarketplaceServiceCard";
import {
  RecommendationCarouselItem,
  RecommendationsCarousel,
  RecommendationsPanelSkeleton,
} from "@/components/recommendations/RecommendationsCarousel";
import { useAuth } from "@/features/auth/auth-context";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { RECOMMENDATION_SLIDER_LIMIT } from "@/features/recommendations/constants";
import { getRecommendedMarketplaceServices } from "@/features/recommendations/api";
import { recommendationKeys } from "@/features/recommendations/query-keys";

export function RecommendedMarketplaceSlider() {
  const t = useTranslations("recommendations");
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data, isLoading } = useQuery({
    queryKey: recommendationKeys.marketplace(RECOMMENDATION_SLIDER_LIMIT, locale),
    queryFn: () => getRecommendedMarketplaceServices(RECOMMENDATION_SLIDER_LIMIT),
    enabled: isAuthenticated && isReady,
    staleTime: 5 * 60 * 1000,
  });

  if (!isAuthenticated || !isReady) return null;

  if (isLoading) {
    return (
      <RecommendationsPanelSkeleton
        title={t("marketplaceTitle")}
        subtitle={t("marketplaceSubtitle")}
      />
    );
  }

  if (!data?.length) return null;

  return (
    <RecommendationsCarousel
      title={t("marketplaceTitle")}
      subtitle={t("marketplaceSubtitle")}
    >
      {data.map((service) => (
        <RecommendationCarouselItem key={service.id}>
          <MarketplaceServiceCard service={service} />
        </RecommendationCarouselItem>
      ))}
    </RecommendationsCarousel>
  );
}

export function useRecommendedMarketplaceVisible(enabled = true) {
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data, isLoading } = useQuery({
    queryKey: recommendationKeys.marketplace(RECOMMENDATION_SLIDER_LIMIT, locale),
    queryFn: () => getRecommendedMarketplaceServices(RECOMMENDATION_SLIDER_LIMIT),
    enabled: enabled && isAuthenticated && isReady,
    staleTime: 5 * 60 * 1000,
  });

  return {
    showGridDivider: Boolean(
      enabled &&
        isAuthenticated &&
        isReady &&
        (isLoading || (data?.length ?? 0) > 0),
    ),
  };
}
