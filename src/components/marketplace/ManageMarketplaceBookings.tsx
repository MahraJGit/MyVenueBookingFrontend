"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Banknote, CalendarCheck, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DashboardPageShell,
  DashboardPanel,
  DashboardStatCard,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
} from "@/components/dashboard/dashboard-ui";
import {
  DashboardPageHeader,
  dashboardSurfaceBorderClass,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardDataTable,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { listServiceBookings } from "@/features/marketplace/api";
import { marketplaceKeys } from "@/features/marketplace/query-keys";
import { getDashboardPaths } from "@/features/dashboard/paths";
import { useAuth } from "@/features/auth/auth-context";
import { decimalToNumber } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import {
  SalesServiceFilter,
  SalesVendorFilter,
} from "@/components/sales/sales-filters";

const STATUS_TABS = [
  "ALL",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
] as const;

type StatusFilter = (typeof STATUS_TABS)[number];

export type ManageMarketplaceBookingsProps = {
  scope: "platform" | "vendor";
  syncWithUrl?: boolean;
};

export function ManageMarketplaceBookings({
  scope,
  syncWithUrl = false,
}: ManageMarketplaceBookingsProps) {
  const isAdmin = scope === "platform";
  const paths = getDashboardPaths(isAdmin ? "admin" : "vendor");
  const t = useTranslations("adminMarketplaceBookings");
  const tVendor = useTranslations("vendorMarketplace");
  const tCommon = useTranslations("common");
  const tUser = useTranslations("userDashboard");
  const tTables = useTranslations("tables");
  const { user, isAuthenticated, isReady } = useAuth();

  const table = useTableQueryState<{
    status: StatusFilter;
    vendorId: string;
    serviceId: string;
  }>({
    initialFilters: { status: "ALL", vendorId: "", serviceId: "" },
    syncWithUrl: isAdmin && syncWithUrl,
  });

  const apiScope = isAdmin ? "platform" : "vendor";
  const statusFilter =
    table.filters.status === "ALL" ? undefined : table.filters.status;

  const queryParams = useMemo(
    () => ({
      page: table.page,
      limit: table.pageSize,
      status: statusFilter,
      scope: apiScope as "platform" | "vendor",
      vendorId: table.filters.vendorId || undefined,
      serviceId: table.filters.serviceId || undefined,
      search: table.debouncedSearch || undefined,
    }),
    [
      apiScope,
      statusFilter,
      table.debouncedSearch,
      table.filters.serviceId,
      table.filters.vendorId,
      table.page,
      table.pageSize,
    ],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: marketplaceKeys.bookings(user?.id, queryParams),
    queryFn: () => listServiceBookings(queryParams),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const bookings = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  useEffect(() => {
    if (isError) toastApiError(error, t("couldNotLoadBookings"));
  }, [isError, error, t]);

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={isAdmin ? t("title") : tVendor("bookingsTitle")}
          description={isAdmin ? t("descriptionAdmin") : t("descriptionVendor")}
        />

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DashboardStatCard
            icon={<CalendarCheck className="h-5 w-5 text-primary" />}
            label={t("totalBookings")}
            value={String(data?.summary?.totalBookings ?? meta?.total ?? 0)}
          />
          <DashboardStatCard
            icon={<Banknote className="h-5 w-5 text-primary" />}
            label={t("totalRevenue")}
            value={(data?.summary?.totalRevenue ?? 0).toLocaleString()}
          />
        </div>

        <DashboardDataTable
          toolbar={{
            search: {
              value: table.search,
              onChange: table.setSearch,
              placeholder: t("searchPlaceholder"),
            },
            filters: (
              <div className="flex w-full flex-col gap-2 sm:flex-row">
                {isAdmin ? (
                  <SalesVendorFilter
                    value={table.filters.vendorId}
                    onChange={(vendorId) => {
                      table.setFilter("vendorId", vendorId);
                      table.setFilter("serviceId", "");
                    }}
                  />
                ) : null}
                <SalesServiceFilter
                  value={table.filters.serviceId}
                  onChange={(serviceId) => table.setFilter("serviceId", serviceId)}
                  scope={isAdmin ? "platform" : "workspace"}
                />
                <Select
                  value={table.filters.status}
                  onValueChange={(value) =>
                    table.setFilter("status", value as StatusFilter)
                  }
                >
                  <SelectTrigger
                    className={cn("w-full sm:w-[180px]", dashboardSelectTriggerClass)}
                  >
                    <SelectValue placeholder={tCommon("status")} />
                  </SelectTrigger>
                  <SelectContent className={dashboardDropdownContentClass}>
                    {STATUS_TABS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value === "ALL"
                          ? tCommon("all")
                          : tUser(`serviceBookingStatus.${value}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ),
            pageSize: { value: table.pageSize, onChange: table.setPageSize },
            onReset: table.reset,
            showReset: table.hasActiveFilters,
            isRefreshing: isFetching && !isLoading,
            trailing: (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn("w-full sm:w-auto", dashboardSurfaceBorderClass)}
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : tCommon("refresh")}
              </Button>
            ),
          }}
          pagination={
            (meta?.total ?? 0) > 0
              ? {
                  label: formatTableRangeLabel({
                    page: table.page,
                    pageSize: table.pageSize,
                    total: meta?.total ?? bookings.length,
                    showingLabel: (values) => tTables("showing", values),
                  }),
                  page: table.page,
                  totalPages,
                  total: meta?.total ?? bookings.length,
                  onPageChange: table.setPage,
                  previousLabel: tCommon("previous"),
                  nextLabel: tCommon("next"),
                  isLoading,
                }
              : undefined
          }
        >
          <Table
            className={cn(dashboardTableClass, "min-w-[980px]")}
            containerClassName={dashboardTableContainerClass}
          >
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <TableHead>{t("service")}</TableHead>
                {isAdmin ? <TableHead>{tCommon("vendor")}</TableHead> : null}
                <TableHead>{t("buyer")}</TableHead>
                <TableHead>{tCommon("dates")}</TableHead>
                <TableHead className="text-right">{tCommon("amount")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead className="text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={isAdmin ? 7 : 6} />
              ) : bookings.length === 0 ? (
                <TableEmptyRow colSpan={isAdmin ? 7 : 6}>
                  {t("noBookings")}
                </TableEmptyRow>
              ) : (
                bookings.map((booking) => {
                  const buyerName = booking.buyer
                    ? `${booking.buyer.firstName} ${booking.buyer.lastName}`.trim()
                    : t("buyerFallback");
                  const total = decimalToNumber(booking.totalAmount);

                  return (
                    <TableRow key={booking.id} className={dashboardTableRowClass}>
                      <TableCell className="font-medium">
                        {booking.service?.title ?? t("serviceFallback")}
                      </TableCell>
                      {isAdmin ? (
                        <TableCell className="text-muted-foreground">
                          {booking.vendor?.vendorName ?? "—"}
                        </TableCell>
                      ) : null}
                      <TableCell>{buyerName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {String(booking.startDate).slice(0, 10)} →{" "}
                        {String(booking.endDate).slice(0, 10)}
                      </TableCell>
                      <TableCell className="text-right">
                        {total.toLocaleString()} {booking.currency}
                      </TableCell>
                      <TableCell>
                        {tUser(
                          `serviceBookingStatus.${booking.status}` as "serviceBookingStatus.CONFIRMED",
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={paths.marketplaceBooking(booking.id)}>
                            {tCommon("view")}
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </DashboardDataTable>
      </DashboardPanel>
    </DashboardPageShell>
  );
}
