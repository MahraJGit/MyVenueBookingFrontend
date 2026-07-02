"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowUpDown, CalendarDays, Loader2 } from "lucide-react";
import { BookingDetailPanel } from "@/components/bookings/BookingDetailPanel";
import {
  VendorBookingsEmptyState,
  VendorBookingsList,
} from "@/components/bookings/VendorBookingsList";
import {
  type BookingSortOption,
  type BookingTabValue,
  countBookingsByTab,
  sortBookings,
} from "@/components/bookings/user-booking-utils";
import { Button } from "@/components/ui/button";
import {
  DashboardPanel,
  DashboardPagination,
  dashboardDropdownContentClass,
} from "@/components/dashboard/dashboard-ui";
import {
  DashboardPageHeader,
  dashboardFilterBarBorderClass,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardFilterBar,
  DashboardScrollableTabs,
} from "@/components/userDashboard/DashboardScrollableTabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DashboardScope } from "@/features/dashboard/paths";
import { listBookings } from "@/features/bookings/api";
import { bookingKeys } from "@/features/venues/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const TAB_VALUES: BookingTabValue[] = ["all", "HOLD", "CONFIRMED", "CANCELLED", "COMPLETED"];

type ManageVenueBookingsProps = {
  scope: DashboardScope;
};

export function ManageVenueBookings({ scope }: ManageVenueBookingsProps) {
  const isAdmin = scope === "admin";
  const t = useTranslations(isAdmin ? "adminVenueBookings" : "vendorDashboard");
  const tUser = useTranslations("userDashboard");
  const tBooking = useTranslations("booking");
  const tCommon = useTranslations("common");
  const tListing = useTranslations("listing");
  const { user, isAuthenticated, isReady } = useAuth();

  const [activeTab, setActiveTab] = useState<BookingTabValue>("all");
  const [sortBy, setSortBy] = useState<BookingSortOption>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setSelectedId(null);
  }, [activeTab, sortBy]);

  const statusFilter = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: bookingKeys.list(user?.id, { status: statusFilter, page, scope }),
    queryFn: () =>
      listBookings({
        page,
        limit: PAGE_SIZE,
        status: statusFilter,
      }),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const { data: countData } = useQuery({
    queryKey: bookingKeys.list(user?.id, { scope, forCounts: true }),
    queryFn: () => listBookings({ limit: 100 }),
    staleTime: 30_000,
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const bookings = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const counts = useMemo(
    () => countBookingsByTab(countData?.data ?? []),
    [countData?.data],
  );

  const sortedBookings = useMemo(
    () => sortBookings(bookings, sortBy),
    [bookings, sortBy],
  );

  const tabLabel = (value: BookingTabValue) => {
    if (value === "all") return tUser("tabAll", { count: counts.all });
    if (value === "HOLD") return `${tUser("onHold")} (${counts.HOLD ?? 0})`;
    if (value === "CONFIRMED") return `${tBooking("confirmed")} (${counts.CONFIRMED ?? 0})`;
    if (value === "CANCELLED") return `${tBooking("cancelled")} (${counts.CANCELLED ?? 0})`;
    return `${tBooking("completed")} (${counts.COMPLETED ?? 0})`;
  };

  const sortLabel =
    sortBy === "newest"
      ? tUser("newestFirst")
      : sortBy === "oldest"
        ? tUser("oldestFirst")
        : sortBy === "amount-high"
          ? tUser("highestAmount")
          : tUser("lowestAmount");

  const pageTitle = isAdmin ? t("title") : t("venueBookingsTitle");
  const pageDesc = isAdmin ? t("description") : t("venueBookingsDesc");

  useEffect(() => {
    if (isError) toastApiError(error, tUser("couldNotLoadBookingsToast"));
  }, [isError, error, tUser]);

  return (
    <DashboardPanel>
      <DashboardPageHeader title={pageTitle} description={pageDesc} />

      <DashboardFilterBar
        className={dashboardFilterBarBorderClass}
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground sm:w-auto">
                {sortLabel}
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn("w-44", dashboardDropdownContentClass)}>
              <DropdownMenuItem onClick={() => setSortBy("newest")}>
                {tUser("newestFirst")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                {tUser("oldestFirst")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("amount-high")}>
                {tUser("highestAmount")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy("amount-low")}>
                {tUser("lowestAmount")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as BookingTabValue)}
          items={TAB_VALUES.map((value) => ({
            value,
            label: tabLabel(value),
          }))}
        />
      </DashboardFilterBar>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm">{tUser("loadingBookings")}</p>
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">{tUser("couldNotLoadBookings")}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            {tCommon("tryAgain")}
          </Button>
        </div>
      ) : sortedBookings.length === 0 ? (
        <VendorBookingsEmptyState
          tab={activeTab}
          message={
            activeTab === "all"
              ? isAdmin
                ? t("noBookings")
                : tBooking("noVenueBookings")
              : undefined
          }
        />
      ) : (
        <>
          {isFetching && !isLoading ? (
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {tCommon("loading")}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-5">
            <div className={selectedId ? "xl:col-span-2" : "xl:col-span-5"}>
              <VendorBookingsList
                bookings={sortedBookings}
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
                {/* <div className="flex w-full items-center justify-center rounded-xl border border-dashed border-[#303030] bg-[#151515]">
                  <div className="py-16 text-center">
                    <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {tUser("selectBookingDetails")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tUser("selectBookingHint")}
                    </p>
                  </div>
                </div> */}
              </div>
            )}
          </div>

          {(meta?.total ?? 0) > 0 ? (
            <DashboardPagination
              className="mt-4"
              label={tListing("pageOfWithCount", {
                page: meta?.page ?? page,
                totalPages,
                total: meta?.total ?? sortedBookings.length,
                type: tListing("bookingsCount"),
              })}
              page={page}
              totalPages={totalPages}
              isLoading={isLoading}
              previousLabel={tCommon("previous")}
              nextLabel={tCommon("next")}
              onPageChange={setPage}
            />
          ) : null}
        </>
      )}
    </DashboardPanel>
  );
}
