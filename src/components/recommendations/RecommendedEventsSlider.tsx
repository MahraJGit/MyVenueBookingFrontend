"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { EventCard } from "@/components/events/EventCard";
import {
  RecommendationCarouselItem,
  RecommendationsCarousel,
  RecommendationsPanelSkeleton,
} from "@/components/recommendations/RecommendationsCarousel";
import { useAuth } from "@/features/auth/auth-context";
import { useLocaleContext } from "@/features/i18n/locale-context";
import { RECOMMENDATION_SLIDER_LIMIT } from "@/features/recommendations/constants";
import { getRecommendedEvents } from "@/features/recommendations/api";
import { recommendationKeys } from "@/features/recommendations/query-keys";

export function RecommendedEventsSlider() {
  const t = useTranslations("recommendations");
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data, isLoading } = useQuery({
    queryKey: recommendationKeys.events(RECOMMENDATION_SLIDER_LIMIT, locale),
    queryFn: () => getRecommendedEvents(RECOMMENDATION_SLIDER_LIMIT),
    enabled: isAuthenticated && isReady,
    staleTime: 5 * 60 * 1000,
  });

  if (!isAuthenticated || !isReady) return null;

  if (isLoading) {
    return (
      <RecommendationsPanelSkeleton
        title={t("eventsTitle")}
        subtitle={t("eventsSubtitle")}
      />
    );
  }

  if (!data?.length) return null;

  return (
    <RecommendationsCarousel title={t("eventsTitle")} subtitle={t("eventsSubtitle")}>
      {data.map((event) => (
        <RecommendationCarouselItem key={event.id}>
          <EventCard event={event} />
        </RecommendationCarouselItem>
      ))}
    </RecommendationsCarousel>
  );
}

export function useRecommendedEventsVisible() {
  const { isAuthenticated, isReady } = useAuth();
  const { locale } = useLocaleContext();

  const { data, isLoading } = useQuery({
    queryKey: recommendationKeys.events(RECOMMENDATION_SLIDER_LIMIT, locale),
    queryFn: () => getRecommendedEvents(RECOMMENDATION_SLIDER_LIMIT),
    enabled: isAuthenticated && isReady,
    staleTime: 5 * 60 * 1000,
  });

  return {
    showGridDivider: Boolean(
      isAuthenticated && isReady && (isLoading || (data?.length ?? 0) > 0),
    ),
  };
}
