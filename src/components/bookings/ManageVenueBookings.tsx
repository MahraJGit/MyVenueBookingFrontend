"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { ArrowUpDown, Loader2 } from "lucide-react";
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
  dashboardDropdownContentClass,
} from "@/components/dashboard/dashboard-ui";
import {
  DashboardPageHeader,
} from "@/components/dashboard/dashboard-shared";
import { DashboardScrollableTabs } from "@/components/userDashboard/DashboardScrollableTabs";
import {
  DashboardDataTable,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
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
import { useTableQueryState } from "@/hooks/use-table-query-state";

const TAB_VALUES: BookingTabValue[] = ["all", "HOLD", "CONFIRMED", "CANCELLED", "COMPLETED"];

type ManageVenueBookingsProps = {
  scope: DashboardScope;
  syncWithUrl?: boolean;
};

export function ManageVenueBookings({ scope, syncWithUrl = false }: ManageVenueBookingsProps) {
  const isAdmin = scope === "admin";
  const apiScope = isAdmin ? "platform" : "workspace";
  const t = useTranslations(isAdmin ? "adminVenueBookings" : "vendorDashboard");
  const tUser = useTranslations("userDashboard");
  const tBooking = useTranslations("booking");
  const tCommon = useTranslations("common");
  const tListing = useTranslations("listing");
  const tTables = useTranslations("tables");
  const { user, isAuthenticated, isReady } = useAuth();

  const [sortBy, setSortBy] = useState<BookingSortOption>("newest");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const table = useTableQueryState<{ status: BookingTabValue; vendorId: string }>({
    initialFilters: { status: "all", vendorId: "" },
    syncWithUrl: isAdmin && syncWithUrl,
  });
  const activeTab = table.filters.status;

  const statusFilter = activeTab === "all" ? undefined : activeTab;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: bookingKeys.list(user?.id, {
      status: statusFilter,
      search: table.debouncedSearch,
      page: table.page,
      limit: table.pageSize,
      scope,
    }),
    queryFn: () =>
      listBookings({
        page: table.page,
        limit: table.pageSize,
        status: statusFilter,
        search: table.debouncedSearch || undefined,
        vendorId: table.filters.vendorId || undefined,
        scope: apiScope,
      }),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const { data: countData } = useQuery({
    queryKey: bookingKeys.list(user?.id, { scope, forCounts: true }),
    queryFn: () => listBookings({ limit: 100, scope: apiScope }),
    staleTime: 30_000,
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const bookings = useMemo(() => data?.data ?? [], [data?.data]);
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

      {isAdmin && data?.summary ? (
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">
            <p className="text-2xl font-semibold text-primary">
              {data.summary.totalBookings}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("totalBookings")}</p>
          </div>
          <div className="rounded-xl border border-[#303030] bg-[#151515] p-4">
            <p className="text-2xl font-semibold text-primary">
              {data.summary.totalRevenue.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{t("totalRevenue")}</p>
          </div>
        </div>
      ) : null}

      <DashboardDataTable
        toolbar={{
          search: {
            value: table.search,
            onChange: table.setSearch,
            placeholder: tListing("searchBookings"),
          },
          filters: (
            <DashboardScrollableTabs
              value={activeTab}
              onValueChange={(value) => {
                table.setFilter("status", value as BookingTabValue);
                setSelectedId(null);
              }}
              items={TAB_VALUES.map((value) => ({
                value,
                label: tabLabel(value),
              }))}
            />
          ),
          pageSize: { value: table.pageSize, onChange: table.setPageSize },
          onReset: () => {
            table.reset();
            setSortBy("newest");
            setSelectedId(null);
          },
          showReset: table.hasActiveFilters || sortBy !== "newest",
          isRefreshing: isFetching && !isLoading,
          trailing: (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground sm:w-auto">
                {sortLabel}
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn("w-44", dashboardDropdownContentClass)}>
              <DropdownMenuItem onClick={() => { setSortBy("newest"); setSelectedId(null); }}>
                {tUser("newestFirst")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("oldest"); setSelectedId(null); }}>
                {tUser("oldestFirst")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("amount-high"); setSelectedId(null); }}>
                {tUser("highestAmount")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortBy("amount-low"); setSelectedId(null); }}>
                {tUser("lowestAmount")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          ),
        }}
        pagination={
          (meta?.total ?? 0) > 0
            ? {
                label: formatTableRangeLabel({
                  page: table.page,
                  pageSize: table.pageSize,
                  total: meta?.total ?? sortedBookings.length,
                  showingLabel: (values) => tTables("showing", values),
                }),
                page: table.page,
                totalPages,
                total: meta?.total ?? sortedBookings.length,
                isLoading,
                previousLabel: tCommon("previous"),
                nextLabel: tCommon("next"),
                onPageChange: table.setPage,
              }
            : undefined
        }
      >

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
                  accessScope={apiScope}
                  onClose={() => setSelectedId(null)}
                  allowReschedule
                  allowCancel
                  variant="vendor"
                  showChat={!isAdmin}
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

        </>
      )}
      </DashboardDataTable>
    </DashboardPanel>
  );
}
