"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowUpDown, CalendarDays, Loader2, Plus } from "lucide-react";
import { BookingDetailPanel } from "@/components/bookings/BookingDetailPanel";
import {
  UserBookingsEmptyState,
  UserBookingsList,
} from "@/components/bookings/UserBookingsList";
import {
  type BookingSortOption,
  type BookingTabValue,
  countBookingsByTab,
  filterBookingsByTab,
  sortBookings,
} from "@/components/bookings/user-booking-utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DashboardFilterBar,
  DashboardScrollableTabs,
  DashboardPageShell,
  DashboardPanel,
  DashboardSortButton,
  dashboardDropdownContentClass,
  dashboardEyebrowClass,
  dashboardTabCountClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listBookings } from "@/features/bookings/api";
import { bookingKeys } from "@/features/venues/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";

const TAB_VALUES: BookingTabValue[] = ["all", "HOLD", "CONFIRMED", "CANCELLED", "COMPLETED"];

export default function UserBookingsPage() {
  const t = useTranslations("userDashboard");
  const tBooking = useTranslations("booking");
  const tCommon = useTranslations("common");
  const { user, isAuthenticated, isReady } = useAuth();
  const [activeTab, setActiveTab] = useState<BookingTabValue>("all");
  const [sortBy, setSortBy] = useState<BookingSortOption>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: bookingKeys.list(user?.id, { scope: "buyer" }),
    queryFn: () => listBookings({ limit: 50, scope: "buyer" }),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const bookings = data?.data ?? [];

  const counts = useMemo(() => countBookingsByTab(bookings), [bookings]);

  const filteredBookings = useMemo(() => {
    const byTab = filterBookingsByTab(bookings, activeTab);
    return sortBookings(byTab, sortBy);
  }, [bookings, activeTab, sortBy]);

  const tabLabel = (value: BookingTabValue) => {
    if (value === "all") return tCommon("all");
    if (value === "HOLD") return t("onHold");
    if (value === "CONFIRMED") return tBooking("confirmed");
    if (value === "CANCELLED") return tBooking("cancelled");
    return tBooking("completed");
  };

  const sortLabel =
    sortBy === "newest"
      ? t("newestFirst")
      : sortBy === "oldest"
        ? t("oldestFirst")
        : sortBy === "amount-high"
          ? t("highestAmount")
          : t("lowestAmount");

  const tabCount = (value: BookingTabValue) => {
    if (value === "all") return counts.all;
    return counts[value] ?? 0;
  };

  useEffect(() => {
    if (isError) toastApiError(error, t("couldNotLoadBookingsToast"));
  }, [isError, error]);

  return (
    <DashboardPageShell>
      <div className={dashboardEyebrowClass}>
        <CalendarDays className="h-3.5 w-3.5" />
        {t("venueReservations")}
      </div>
      <DashboardPageHeader
        title={t("myVenueBookings")}
        description={t("bookingsSubtitle")}
        action={
          <Button asChild className="w-full sm:w-auto">
            <Link href="/venues" className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t("bookAVenue")}
            </Link>
          </Button>
        }
      />

      <DashboardPanel className="space-y-0">
          <DashboardFilterBar
            action={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <DashboardSortButton>
                    {sortLabel}
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </DashboardSortButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className={dashboardDropdownContentClass}>
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>
                    {t("newestFirst")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                    {t("oldestFirst")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("amount-high")}>
                    {t("highestAmount")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("amount-low")}>
                    {t("lowestAmount")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          >
            <DashboardScrollableTabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                setSelectedId(null);
              }}
              items={TAB_VALUES.map((value) => ({
                value,
                label: (
                  <>
                    {tabLabel(value)}
                    <span className={dashboardTabCountClass}>
                      {tabCount(value)}
                    </span>
                  </>
                ),
              }))}
            />
          </DashboardFilterBar>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">{t("loadingBookings")}</p>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {t("couldNotLoadBookings")}
              </p>
              <Button variant="outline" onClick={() => void refetch()}>
                {tCommon("tryAgain")}
              </Button>
            </div>
          ) : bookings.length === 0 ? (
            <UserBookingsEmptyState tab="all" />
          ) : filteredBookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {t("noBookingsMatchFilter")}
              </p>
              <Button variant="outline" onClick={() => setActiveTab("all")}>
                {t("showAllBookings")}
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 xl:grid-cols-5">
              <div className={selectedId ? "xl:col-span-2" : "xl:col-span-5"}>
                <UserBookingsList
                  bookings={filteredBookings}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </div>

              {selectedId ? (
                <div className="xl:col-span-3">
                  <BookingDetailPanel
                    bookingId={selectedId}
                    onClose={() => setSelectedId(null)}
                    allowReschedule
                    allowCancel
                    variant="user"
                  />
                </div>
              ) : (
                <div className="hidden xl:flex xl:col-span-3">
                  <Card className="flex w-full items-center justify-center border-dashed border-zinc-800 bg-zinc-950/20">
                    <CardContent className="py-16 text-center">
                      <CalendarDays className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
                      <p className="text-sm font-medium text-zinc-400">
                        {t("selectBookingDetails")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("selectBookingHint")}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
      </DashboardPanel>
    </DashboardPageShell>
  );
}
