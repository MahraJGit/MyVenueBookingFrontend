"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowRight, Heart, Loader2 } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { VenueCard } from "@/components/venues/VenueCard";
import { AttractionCard } from "@/components/attractions/AttractionCard";
import { Button } from "@/components/ui/button";
import {
  DashboardContentPanel,
  dashboardFilterBarBorderClass,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardFilterBar,
  DashboardScrollableTabs,
} from "@/components/userDashboard/DashboardScrollableTabs";
import { listFavorites } from "@/features/favorites/api";
import { favoriteKeys } from "@/features/favorites/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";

type FavouritesTab = "events" | "venues" | "attractions";

const TAB_VALUES: FavouritesTab[] = ["events", "venues", "attractions"];

const BROWSE_HREF: Record<FavouritesTab, string> = {
  events: "/events",
  venues: "/venues",
  attractions: "/attractions",
};

export default function FavouritesPage() {
  const t = useTranslations("userDashboard");
  const tFav = useTranslations("favorites");
  const tCommon = useTranslations("common");
  const { user, isAuthenticated, isReady } = useAuth();
  const [activeTab, setActiveTab] = useState<FavouritesTab>("events");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: favoriteKeys.list(user?.id, "all"),
    queryFn: () => listFavorites("all"),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const events = data?.events ?? [];
  const venues = data?.venues ?? [];
  const attractions = data?.attractions ?? [];
  const isEmpty =
    activeTab === "events"
      ? events.length === 0
      : activeTab === "venues"
        ? venues.length === 0
        : attractions.length === 0;

  const tabLabels = {
    events: `${tFav("events")} (${events.length})`,
    venues: `${tFav("venues")} (${venues.length})`,
    attractions: `${tFav("attractions")} (${attractions.length})`,
  } as const;

  const browseLabels: Record<FavouritesTab, string> = {
    events: t("browseEvents"),
    venues: t("browseVenues"),
    attractions: tFav("browseAttractions"),
  };

  return (
    <DashboardContentPanel>
      <DashboardFilterBar className={dashboardFilterBarBorderClass}>
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={TAB_VALUES.map((value) => ({
            value,
            label: tabLabels[value],
          }))}
        />
      </DashboardFilterBar>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : t("couldNotLoadFavourites")}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              refetch().catch((err) => toastApiError(err));
            }}
          >
            {tCommon("tryAgain")}
          </Button>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Heart className="h-12 w-12 text-primary" />
          <h3 className="text-lg font-semibold">{t("noFavourites")}</h3>
          <p className="max-w-sm text-muted-foreground">{t("noFavouritesDesc")}</p>
          <Button asChild>
            <Link href={BROWSE_HREF[activeTab]} className="inline-flex items-center gap-2">
              {browseLabels[activeTab]}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <ResponsiveEventCardsGrid>
          {activeTab === "events"
            ? events.map((event) => <EventCard key={event.id} event={event} />)
            : activeTab === "venues"
              ? venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)
              : attractions.map((attraction) => (
                  <AttractionCard key={attraction.id} attraction={attraction} />
                ))}
        </ResponsiveEventCardsGrid>
      )}
    </DashboardContentPanel>
  );
}
