"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Heart, Loader2 } from "lucide-react";
import { EventCard } from "@/components/events/EventCard";
import { ResponsiveEventCardsGrid } from "@/components/events/ResponsiveEventCardsGrid";
import { VenueCard } from "@/components/venues/VenueCard";
import { Button } from "@/components/ui/button";
import { DashboardScrollableTabs } from "@/components/userDashboard/DashboardScrollableTabs";
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

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#121212] p-8 text-center">
        <p className="mb-4 text-muted-foreground">
          {error instanceof Error ? error.message : t("couldNotLoadFavourites")}
        </p>
        <Button
          onClick={() => {
            refetch().catch((err) => toastApiError(err));
          }}
        >
          {tCommon("tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("favourites")}</h1>
        <p className="text-sm text-muted-foreground">{t("favouritesSubtitle")}</p>
      </div>

      <DashboardScrollableTabs
        variant="pill"
        value={activeTab}
        onValueChange={setActiveTab}
        listClassName="w-full justify-center"
        items={TAB_VALUES.map((value) => ({
          value,
          label: value === "events" ? tFav("events") : tFav("venues"),
        }))}
      />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-[#121212] px-6 py-16 text-center">
          <Heart className="mb-4 size-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">{t("noFavourites")}</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {t("noFavouritesDesc")}
          </p>
          <div className="mt-6">
            <Button asChild>
              <Link href={isEventsTab ? "/events" : "/venues"}>
                {isEventsTab ? t("browseEvents") : t("browseVenues")}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <ResponsiveEventCardsGrid>
          {isEventsTab
            ? events.map((event) => <EventCard key={event.id} event={event} />)
            : venues.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        </ResponsiveEventCardsGrid>
      )}
    </div>
  );
}
