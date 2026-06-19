"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  Clapperboard,
  Loader2,
  Plus,
  Ticket,
  TrendingUp,
} from "lucide-react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listManagedEvents } from "@/features/events/api";
import { listManagedVenues } from "@/features/venues/api";
import { venueKeys } from "@/features/venues/query-keys";
import { getDashboardPaths } from "@/features/dashboard/paths";

function StatCard({
  title,
  value,
  hint,
  href,
}: {
  title: string;
  value: number | string;
  hint: string;
  href: string;
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
          <Link href={href}>View all</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function VendorDashboardHome() {
  const paths = getDashboardPaths("vendor");

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["managed-events", "vendor-overview"],
    queryFn: () =>
      listManagedEvents({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
  });

  const { data: venuesData, isLoading: venuesLoading } = useQuery({
    queryKey: venueKeys.managedList({ overview: true }),
    queryFn: () => listManagedVenues({ limit: 100 }),
  });

  const events = eventsData?.data ?? [];
  const venues = venuesData?.data ?? [];
  const pendingEvents = events.filter((e) => e.status === "PENDING").length;
  const pendingVenues = venues.filter((v) => v.status === "PENDING").length;
  const loading = eventsLoading || venuesLoading;

  return (
    <RoleGuard allowedRoles={["VENDOR", "ADMIN"]}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Vendor Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Manage your events and venues. New listings require admin approval before
              they go live.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="bg-primary">
              <Link href={paths.addEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Create event
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-[#303030]">
              <Link href={paths.addVenue}>
                <Plus className="mr-2 h-4 w-4" />
                Add venue
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="My Events"
              value={events.length}
              hint={`${pendingEvents} pending approval`}
              href={paths.events}
            />
            <StatCard
              title="My Venues"
              value={venues.length}
              hint={`${pendingVenues} pending approval`}
              href={paths.venues}
            />
            <StatCard
              title="Venue Bookings"
              value="—"
              hint="Bookings for your venues"
              href={paths.venueBookings}
            />
            <StatCard
              title="Analytics"
              value="—"
              hint="Ticket sales and engagement"
              href={paths.analytics}
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-[#303030] bg-[#1B1B1B]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Clapperboard className="h-5 w-5 text-primary" />
                Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Create events, manage ticket types, and track approval status.</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" className="bg-primary">
                  <Link href={paths.addEvent}>Create event</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.events}>My events</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.tickets}>
                    <Ticket className="mr-1 h-3 w-3" />
                    Ticket sales
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#303030] bg-[#1B1B1B]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Building2 className="h-5 w-5 text-primary" />
                Venues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Set up venue details, pricing, schedules, and availability blocks.</p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button asChild size="sm" className="bg-primary">
                  <Link href={paths.addVenue}>Add venue</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.venues}>My venues</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className="border-[#303030]">
                  <Link href={paths.venueBookings}>
                    <CalendarDays className="mr-1 h-3 w-3" />
                    Bookings
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
              Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="border-[#303030]">
              <Link href={paths.analytics}>Open analytics & reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
}
