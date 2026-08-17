"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { Banknote, CalendarCheck, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { BookingDetailPanel } from "@/components/bookings/BookingDetailPanel";
import {
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
  SalesVendorFilter,
  SalesVenueFilter,
} from "@/components/sales/sales-filters";
import { listBookings } from "@/features/bookings/api";
import type { BookingStatus } from "@/features/bookings/types";
import { bookingKeys } from "@/features/venues/query-keys";
import { useAuth } from "@/features/auth/auth-context";
import { decimalToNumber } from "@/features/venues/utils";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useTableQueryState } from "@/hooks/use-table-query-state";

const STATUS_OPTIONS = [
  "ALL",
  "HOLD",
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
] as const;

type StatusFilter = (typeof STATUS_OPTIONS)[number];

function formatDate(iso: string, timeZone?: string | null) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone ? { timeZone } : {}),
    });
  } catch {
    return iso;
  }
}

function statusBadgeVariant(status: BookingStatus) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "default";
  if (status === "PENDING" || status === "HOLD") return "secondary";
  return "destructive";
}

export type ManageVenueBookingSalesProps = {
  scope: "platform" | "workspace";
  syncWithUrl?: boolean;
};

export function ManageVenueBookingSales({
  scope,
  syncWithUrl = false,
}: ManageVenueBookingSalesProps) {
  const isAdmin = scope === "platform";
  const t = useTranslations("adminVenueBookings");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("entityStatus");
  const tTables = useTranslations("tables");
  const tListing = useTranslations("listing");
  const { user, isAuthenticated, isReady } = useAuth();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const table = useTableQueryState<{
    status: StatusFilter;
    vendorId: string;
    venueId: string;
  }>({
    initialFilters: { status: "ALL", vendorId: "", venueId: "" },
    syncWithUrl,
  });

  const statusFilter =
    table.filters.status === "ALL" ? undefined : (table.filters.status as BookingStatus);

  const queryParams = useMemo(
    () => ({
      page: table.page,
      limit: table.pageSize,
      status: statusFilter,
      search: table.debouncedSearch || undefined,
      vendorId: table.filters.vendorId || undefined,
      venueId: table.filters.venueId || undefined,
      scope,
    }),
    [
      scope,
      statusFilter,
      table.debouncedSearch,
      table.filters.vendorId,
      table.filters.venueId,
      table.page,
      table.pageSize,
    ],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: bookingKeys.list(user?.id, queryParams),
    queryFn: () => listBookings(queryParams),
    enabled: isAuthenticated && isReady && !!user?.id,
  });

  const bookings = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const currency = bookings[0]?.venue?.pricing?.currency ?? "PKR";

  const statusLabel = (status: StatusFilter | BookingStatus) => {
    const map: Record<string, string> = {
      ALL: t("allStatuses"),
      DRAFT: tStatus("draft"),
      HOLD: tStatus("hold"),
      PENDING: tStatus("pending"),
      CONFIRMED: tStatus("confirmed"),
      COMPLETED: tStatus("completed"),
      CANCELLED: tStatus("cancelled"),
    };
    return map[status] ?? status;
  };

  useEffect(() => {
    if (isError) toastApiError(error, t("couldNotLoadBookings"));
  }, [isError, error, t]);

  const colSpan = isAdmin ? 7 : 6;

  return (
    <DashboardPanel>
      <DashboardPageHeader
        title={t("title")}
        description={isAdmin ? t("description") : t("descriptionVendor")}
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
          value={`${(data?.summary?.totalRevenue ?? 0).toLocaleString()} ${currency}`}
        />
      </div>

      <DashboardDataTable
        toolbar={{
          search: {
            value: table.search,
            onChange: table.setSearch,
            placeholder: tListing("searchBookings"),
          },
          filters: (
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              {isAdmin ? (
                <SalesVendorFilter
                  value={table.filters.vendorId}
                  onChange={(vendorId) => {
                    table.setFilter("vendorId", vendorId);
                    table.setFilter("venueId", "");
                    setSelectedId(null);
                  }}
                />
              ) : null}
              <SalesVenueFilter
                value={table.filters.venueId}
                onChange={(venueId) => {
                  table.setFilter("venueId", venueId);
                  setSelectedId(null);
                }}
                scope={scope}
              />
              <Select
                value={table.filters.status}
                onValueChange={(value) => {
                  table.setFilter("status", value as StatusFilter);
                  setSelectedId(null);
                }}
              >
                <SelectTrigger
                  className={cn("w-full sm:w-[180px]", dashboardSelectTriggerClass)}
                >
                  <SelectValue placeholder={tCommon("status")} />
                </SelectTrigger>
                <SelectContent className={dashboardDropdownContentClass}>
                  {STATUS_OPTIONS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {statusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ),
          pageSize: { value: table.pageSize, onChange: table.setPageSize },
          onReset: () => {
            table.reset();
            setSelectedId(null);
          },
          showReset: table.hasActiveFilters,
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
          className={cn(dashboardTableClass, "min-w-[1000px]")}
          containerClassName={dashboardTableContainerClass}
        >
          <TableHeader>
            <TableRow className={dashboardTableHeaderRowClass}>
              <TableHead>{t("venue")}</TableHead>
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
              <TableSkeleton cols={colSpan} />
            ) : bookings.length === 0 ? (
              <TableEmptyRow colSpan={colSpan}>{t("noBookings")}</TableEmptyRow>
            ) : (
              bookings.map((booking) => {
                const buyerName = booking.buyer
                  ? `${booking.buyer.firstName} ${booking.buyer.lastName}`.trim()
                  : (booking.guestName ?? t("buyer"));
                const total = decimalToNumber(booking.totalAmount);

                return (
                  <TableRow key={booking.id} className={dashboardTableRowClass}>
                    <TableCell className="font-medium">{booking.venue?.name ?? "—"}</TableCell>
                    {isAdmin ? (
                      <TableCell className="text-muted-foreground">
                        {booking.venue?.vendor?.vendorName ?? "—"}
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <div className="text-sm">{buyerName}</div>
                      {booking.buyer?.email ? (
                        <div className="text-xs text-muted-foreground">
                          {booking.buyer.email}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(booking.startTime, booking.venue?.timezone)}
                    </TableCell>
                    <TableCell className="text-right">
                      {total.toLocaleString()}{" "}
                      {booking.venue?.pricing?.currency ?? currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(booking.status)}>
                        {statusLabel(booking.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setSelectedId((current) =>
                            current === booking.id ? null : booking.id,
                          )
                        }
                      >
                        {tCommon("view")}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </DashboardDataTable>

      {selectedId ? (
        <div className="mt-6">
          <BookingDetailPanel
            bookingId={selectedId}
            accessScope={scope}
            onClose={() => setSelectedId(null)}
            allowReschedule
            allowCancel
            variant="vendor"
            showChat={!isAdmin}
          />
        </div>
      ) : null}
    </DashboardPanel>
  );
}
