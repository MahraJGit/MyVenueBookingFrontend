"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowRight, Heart, Loader2 } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { VenueCard } from "@/components/venues/VenueCard";
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
import { toastApiError } from "@/lib/toasts";

type FavouritesTab = "events" | "venues";

const TAB_VALUES: FavouritesTab[] = ["events", "venues"];

export default function FavouritesPage() {
  const t = useTranslations("userDashboard");
  const tFav = useTranslations("favorites");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<FavouritesTab>("events");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: favoriteKeys.list("all"),
    queryFn: () => listFavorites("all"),
  });

  const events = data?.events ?? [];
  const venues = data?.venues ?? [];
  const isEventsTab = activeTab === "events";
  const items = isEventsTab ? events : venues;
  const isEmpty = items.length === 0;

  const tabLabels = {
    events: `${tFav("events")} (${events.length})`,
    venues: `${tFav("venues")} (${venues.length})`,
  } as const;

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
            <Link href={isEventsTab ? "/events" : "/venues"} className="inline-flex items-center gap-2">
              {isEventsTab ? t("browseEvents") : t("browseVenues")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <ResponsiveEventCardsGrid>
          {isEventsTab
            ? events.map((event) => <EventCard key={event.id} event={event} />)
            : venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        </ResponsiveEventCardsGrid>
      )}
    </DashboardContentPanel>
  );
}
