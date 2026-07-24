"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import {
  Building2,
  CalendarDays,
  Clapperboard,
  FerrisWheel,
  Plus,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listManagedAttractions } from "@/features/attractions/api";
import { listManagedEvents } from "@/features/events/api";
import { listManagedVenues } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import { getDashboardPaths } from "@/features/dashboard/paths";
import {
  DashboardLoadingState,
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared";

function StatCard({
  title,
  value,
  hint,
  href,
  viewAllLabel,
}: {
  title: string;
  value: number | string;
  hint: string;
  href: string;
  viewAllLabel: string;
}) {
  return (
    <Card className="border-[#303030] bg-[#1B1B1B]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
        <Button asChild size="sm" variant="outline" className="border-[#303030]">
          <Link href={href}>{viewAllLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VendorDashboardHome() {
  const t = useTranslations("vendorDashboard");
  const tCommon = useTranslations("common");
  const paths = getDashboardPaths("vendor");

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["managed-events", "vendor-overview"],
    queryFn: () =>
      listManagedEvents({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
  });

  const { data: attractionsData, isLoading: attractionsLoading } = useQuery({
    queryKey: ["managed-attractions", "vendor-overview"],
    queryFn: () =>
      listManagedAttractions({
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const { data: venuesData, isLoading: venuesLoading } = useQuery({
    queryKey: venueKeys.managedList({ overview: true }),
    queryFn: () => listManagedVenues({ limit: 100 }),
  });

  const events = (eventsData?.data ?? []).filter((e) => !e.isDeleted);
  const attractions = (attractionsData?.data ?? []).filter((a) => !a.isDeleted);
  const venues = venuesData?.data ?? [];
  const pendingEvents = events.filter((e) => e.status === "PENDING").length;
  const pendingAttractions = attractions.filter((a) => a.status === "PENDING").length;
  const pendingVenues = venues.filter((v) => v.status === "PENDING").length;
  const loading = eventsLoading || attractionsLoading || venuesLoading;

  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <DashboardPageHeader
            title={t("vendorDashboardTitle")}
            description={t("vendorWelcomeDesc")}
          />
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-primary">
              <Link href={paths.addEvent}>
                <Plus className="mr-2 h-4 w-4" />
                {t("createEvent")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-[#303030]">
              <Link href={paths.addAttraction}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addAttraction")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-[#303030]">
              <Link href={paths.addVenue}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addVenue")}
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <DashboardLoadingState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              title={t("myEvents")}
              value={events.length}
              hint={t("pendingApproval", { count: pendingEvents })}
              href={paths.events}
              viewAllLabel={tCommon("viewAll")}
            />
            <StatCard
              title={t("myAttractions")}
              value={attractions.length}
              hint={t("pendingApproval", { count: pendingAttractions })}
              href={paths.attractions}
              viewAllLabel={tCommon("viewAll")}
            />
            <StatCard
              title={t("myVenues")}
              value={venues.length}
              hint={t("pendingApproval", { count: pendingVenues })}
              href={paths.venues}
              viewAllLabel={tCommon("viewAll")}
            />
            <StatCard
              title={t("venueBookings")}
              value="—"
              hint={t("bookingsForVenues")}
              href={paths.venueBookings}
              viewAllLabel={tCommon("viewAll")}
            />
            <StatCard
              title={t("analytics")}
              value="—"
              hint={t("analyticsDesc")}
              href={paths.analytics}
              viewAllLabel={tCommon("viewAll")}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-2">
          <Card className="border-[#303030] bg-[#1B1B1B]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clapperboard className="h-5 w-5 text-primary" />
                {t("eventsSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t("eventsSectionDesc")}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" className="bg-primary">
                  <Link href={paths.addEvent}>{t("createEvent")}</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.events}>{t("myEventsLink")}</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.tickets}>
                    <Ticket className="mr-1 h-3 w-3" />
                    {t("ticketSales")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#303030] bg-[#1B1B1B]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FerrisWheel className="h-5 w-5 text-primary" />
                {t("attractionsSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t("attractionsSectionDesc")}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" className="bg-primary">
                  <Link href={paths.addAttraction}>{t("addAttraction")}</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.attractions}>{t("myAttractionsLink")}</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.attractionTickets}>
                    <Ticket className="mr-1 h-3 w-3" />
                    {t("attractionTickets")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#303030] bg-[#1B1B1B]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5 text-primary" />
                {t("venuesSection")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>{t("venuesSectionDesc")}</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" className="bg-primary">
                  <Link href={paths.addVenue}>{t("addVenue")}</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.venues}>{t("myVenuesLink")}</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.venueBookings}>
                    <CalendarDays className="mr-1 h-3 w-3" />
                    {t("venueBookings")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-[#303030] bg-[#1B1B1B]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5 text-primary" />
              {t("reports")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="border-[#303030]">
              <Link href={paths.analytics}>{t("openAnalytics")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
