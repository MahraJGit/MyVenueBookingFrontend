"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Banknote, ExternalLink, Loader2, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  getAttractionTicketSales,
  type TicketSaleStatusFilter,
} from "@/features/attraction-ticket-purchases/api";
import { formatTicketPrice } from "@/features/events/utils";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import {
  DashboardPageHeader,
  dashboardFilterBarBorderClass,
  dashboardSurfaceBorderClass,
} from "@/components/dashboard/dashboard-shared";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardStatCard,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
} from "@/components/dashboard/dashboard-ui";
import {
  DashboardDataTable,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import { DashboardFilterBar } from "@/components/userDashboard/DashboardScrollableTabs";
import { SalesVendorFilter } from "@/components/sales/sales-filters";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useTableQueryState } from "@/hooks/use-table-query-state";

const selectTriggerClass = dashboardSelectTriggerClass;
const selectContentClass = dashboardDropdownContentClass;

function formatDateTime(iso: string, timeZone?: string | null) {
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

function statusBadgeVariant(status: string) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "default";
  if (status === "PENDING") return "secondary";
  return "destructive";
}

export type ManageAttractionTicketSalesProps = {
  scope: "workspace" | "platform";
  syncWithUrl?: boolean;
};

export function ManageAttractionTicketSales({
  scope,
  syncWithUrl = false,
}: ManageAttractionTicketSalesProps) {
  const t = useTranslations("adminManageAttractionTickets");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("entityStatus");
  const tAdmin = useTranslations("adminDashboard");
  const tTables = useTranslations("tables");
  const isAdmin = scope === "platform";

  const [groupByAttraction, setGroupByAttraction] = useState(false);
  const table = useTableQueryState<{
    status: TicketSaleStatusFilter;
    attractionId: string;
    vendorId: string;
  }>({
    initialFilters: { status: "CONFIRMED", attractionId: "ALL", vendorId: "" },
    syncWithUrl,
  });

  const queryParams = useMemo(
    () => ({
      scope,
      status: table.filters.status,
      attractionId:
        table.filters.attractionId === "ALL" ? undefined : table.filters.attractionId,
      vendorId: table.filters.vendorId || undefined,
      search: table.debouncedSearch || undefined,
      page: table.page,
      limit: table.pageSize,
    }),
    [scope, table.debouncedSearch, table.filters, table.page, table.pageSize],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["attraction-ticket-sales", queryParams],
    queryFn: () => getAttractionTicketSales(queryParams),
  });

  const summary = useMemo(() => data?.summary ?? [], [data?.summary]);
  const records = data?.records ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const totals = useMemo(() => {
    return summary.reduce(
      (acc, row) => ({
        tickets: acc.tickets + row.totalTicketsSold,
        revenue: acc.revenue + row.totalRevenue,
      }),
      { tickets: 0, revenue: 0 },
    );
  }, [summary]);

  const currency = summary[0]?.currency ?? records[0]?.currency ?? "PKR";

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      CONFIRMED: tStatus("confirmed"),
      PENDING: tStatus("pending"),
      CANCELLED: tStatus("cancelled"),
      COMPLETED: tStatus("completed"),
      REFUNDED: tStatus("refunded"),
    };
    return map[status] ?? status;
  };

  useEffect(() => {
    if (isError) toastApiError(error, t("couldNotLoad"));
  }, [isError, error, t]);

  const showSalesPagination =
    !groupByAttraction && !isLoading && (pagination?.total ?? 0) > 0;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t("title")}
          description={isAdmin ? t("descriptionAdmin") : t("descriptionVendor")}
        />

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <DashboardStatCard
            icon={<Ticket className="h-5 w-5 text-primary" />}
            label={t("ticketsSold")}
            value={String(totals.tickets)}
          />
          <DashboardStatCard
            icon={<Banknote className="h-5 w-5 text-primary" />}
            label={t("revenueFiltered")}
            value={formatTicketPrice(totals.revenue, currency)}
          />
        </div>

        <DashboardFilterBar className={dashboardFilterBarBorderClass}>
          <div className="flex w-full items-center justify-end gap-3">
            <Label htmlFor="group-by-attraction-toggle" className="text-sm text-muted-foreground">
              {t("groupByAttraction")}
            </Label>
            <Switch
              id="group-by-attraction-toggle"
              checked={groupByAttraction}
              onCheckedChange={setGroupByAttraction}
              aria-label={t("groupByAttraction")}
            />
          </div>
        </DashboardFilterBar>

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
                  table.setFilter("attractionId", "ALL");
                }}
              />
            ) : null}
            <Select
              value={table.filters.status}
              onValueChange={(v) => table.setFilter("status", v as TicketSaleStatusFilter)}
            >
              <SelectTrigger className={cn("w-full sm:w-[160px]", selectTriggerClass)}>
                <SelectValue placeholder={tCommon("status")} />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="CONFIRMED">{tStatus("confirmed")}</SelectItem>
                <SelectItem value="PENDING">{tStatus("pending")}</SelectItem>
                <SelectItem value="CANCELLED">{tStatus("cancelled")}</SelectItem>
                <SelectItem value="REFUNDED">{tStatus("refunded")}</SelectItem>
                <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={table.filters.attractionId}
              onValueChange={(v) => table.setFilter("attractionId", v)}
            >
              <SelectTrigger className={cn("w-full sm:w-[200px]", selectTriggerClass)}>
                <SelectValue placeholder={tAdmin("tableAttraction")} />
              </SelectTrigger>
              <SelectContent className={selectContentClass}>
                <SelectItem value="ALL">{t("allAttractions")}</SelectItem>
                {summary.map((ev) => (
                  <SelectItem key={ev.attractionId} value={ev.attractionId}>
                    {ev.attractionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
              </div>
            ),
            pageSize: { value: table.pageSize, onChange: table.setPageSize },
            onReset: table.reset,
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
            showSalesPagination
              ? {
                  label: formatTableRangeLabel({
                    page: table.page,
                    pageSize: table.pageSize,
                    total: pagination?.total ?? records.length,
                    showingLabel: (values) => tTables("showing", values),
                  }),
                  page: table.page,
                  totalPages,
                  total: pagination?.total ?? records.length,
                  onPageChange: table.setPage,
                  previousLabel: tCommon("previous"),
                  nextLabel: tCommon("next"),
                  isLoading,
                }
              : undefined
          }
        >
          {groupByAttraction ? (
            <ByAttractionTable
              isAdmin={isAdmin}
              isLoading={isLoading}
              rows={summary}
              t={t}
              tAdmin={tAdmin}
              tCommon={tCommon}
            />
          ) : (
            <SalesLogTable
              isAdmin={isAdmin}
              isLoading={isLoading}
              rows={records}
              statusLabel={statusLabel}
              t={t}
              tAdmin={tAdmin}
              tCommon={tCommon}
            />
          )}
        </DashboardDataTable>
      </DashboardPanel>
    </DashboardPageShell>
  );
}

function ByAttractionTable({
  isAdmin,
  isLoading,
  rows,
  t,
  tAdmin,
  tCommon,
}: {
  isAdmin: boolean;
  isLoading: boolean;
  rows: Awaited<ReturnType<typeof getAttractionTicketSales>>["summary"];
  t: ReturnType<typeof useTranslations<"adminManageAttractionTickets">>;
  tAdmin: ReturnType<typeof useTranslations<"adminDashboard">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const colSpan = isAdmin ? 8 : 7;

  return (
    <Table
      className={cn(dashboardTableClass, "min-w-[1000px]")}
      containerClassName={dashboardTableContainerClass}
    >
      <TableHeader>
        <TableRow className={dashboardTableHeaderRowClass}>
          <TableHead className="min-w-[180px] whitespace-nowrap text-muted-foreground">
            {tAdmin("tableAttraction")}
          </TableHead>
          {isAdmin ? (
            <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
              {tCommon("vendor")}
            </TableHead>
          ) : null}
          <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
            {tAdmin("tableCity")}
          </TableHead>
          <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
            {t("ticketType")}
          </TableHead>
          <TableHead className="min-w-[80px] whitespace-nowrap text-right text-muted-foreground">
            {tCommon("sold")}
          </TableHead>
          <TableHead className="min-w-[110px] whitespace-nowrap text-right text-muted-foreground">
            {tCommon("inventory")}
          </TableHead>
          <TableHead className="min-w-[110px] whitespace-nowrap text-right text-muted-foreground">
            {tCommon("revenue")}
          </TableHead>
          <TableHead className="min-w-[56px] whitespace-nowrap text-muted-foreground" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableSkeleton cols={colSpan} />
        ) : rows.length === 0 ? (
          <TableEmptyRow colSpan={colSpan}>{t("noTicketSales")}</TableEmptyRow>
        ) : (
          rows.flatMap((attraction) =>
            attraction.ticketTypes.length > 0
              ? attraction.ticketTypes.map((tt, idx) => (
                  <TableRow
                    key={`${attraction.attractionId}-${tt.ticketTypeId}`}
                    className={dashboardTableRowClass}
                  >
                    <TableCell className="font-medium">
                      {idx === 0 ? attraction.attractionName : ""}
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-muted-foreground">
                        {idx === 0 ? (attraction.vendorName ?? "—") : ""}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-muted-foreground">
                      {idx === 0 ? (attraction.city || "—") : ""}
                    </TableCell>
                    <TableCell>{tt.name}</TableCell>
                    <TableCell className="text-right">{tt.ticketsSoldInFilter}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {tt.quantitySold} / {tt.quantityTotal}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatTicketPrice(tt.revenueInFilter, tt.currency)}
                    </TableCell>
                    <TableCell>
                      {idx === 0 ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Link
                            href={`/attractions/${attraction.attractionSlug}`}
                            target="_blank"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              : [
                  <TableRow
                    key={attraction.attractionId}
                    className={dashboardTableRowClass}
                  >
                    <TableCell className="font-medium">
                      {attraction.attractionName}
                    </TableCell>
                    {isAdmin ? (
                      <TableCell className="text-muted-foreground">
                        {attraction.vendorName ?? "—"}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-muted-foreground">
                      {attraction.city || "—"}
                    </TableCell>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      {t("noTicketTypes")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Link
                          href={`/attractions/${attraction.attractionSlug}`}
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>,
                ],
          )
        )}
      </TableBody>
    </Table>
  );
}

function SalesLogTable({
  isAdmin,
  isLoading,
  rows,
  statusLabel,
  t,
  tAdmin,
  tCommon,
}: {
  isAdmin: boolean;
  isLoading: boolean;
  rows: Awaited<ReturnType<typeof getAttractionTicketSales>>["records"];
  statusLabel: (status: string) => string;
  t: ReturnType<typeof useTranslations<"adminManageAttractionTickets">>;
  tAdmin: ReturnType<typeof useTranslations<"adminDashboard">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const colSpan = isAdmin ? 10 : 9;

  return (
    <Table
      className={cn(dashboardTableClass, "min-w-[1200px]")}
      containerClassName={dashboardTableContainerClass}
    >
      <TableHeader>
        <TableRow className={dashboardTableHeaderRowClass}>
          <TableHead className="min-w-[120px] whitespace-nowrap text-muted-foreground">
            {tCommon("order")}
          </TableHead>
          <TableHead className="min-w-[180px] whitespace-nowrap text-muted-foreground">
            {tAdmin("tableAttraction")}
          </TableHead>
          <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
            {t("showDate")}
          </TableHead>
          <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
            {t("ticketType")}
          </TableHead>
          <TableHead className="min-w-[180px] whitespace-nowrap text-muted-foreground">
            {t("buyer")}
          </TableHead>
          {isAdmin ? (
            <TableHead className="min-w-[140px] whitespace-nowrap text-muted-foreground">
              {tCommon("vendor")}
            </TableHead>
          ) : null}
          <TableHead className="min-w-[70px] whitespace-nowrap text-right text-muted-foreground">
            {tCommon("qty")}
          </TableHead>
          <TableHead className="min-w-[100px] whitespace-nowrap text-right text-muted-foreground">
            {tCommon("amount")}
          </TableHead>
          <TableHead className="min-w-[110px] whitespace-nowrap text-muted-foreground">
            {tCommon("status")}
          </TableHead>
          <TableHead className="min-w-[160px] whitespace-nowrap text-muted-foreground">
            {tCommon("purchased")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableSkeleton cols={colSpan} />
        ) : rows.length === 0 ? (
          <TableEmptyRow colSpan={colSpan}>{t("noSalesRecords")}</TableEmptyRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id} className={dashboardTableRowClass}>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {row.orderCode ?? "—"}
              </TableCell>
              <TableCell className="font-medium">{row.attractionName}</TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {row.occurrenceStartDateTime
                  ? formatDateTime(row.occurrenceStartDateTime, row.timezone)
                  : "—"}
              </TableCell>
              <TableCell>{row.ticketTypeName}</TableCell>
              <TableCell>
                <div className="text-sm">
                  {row.buyer.firstName} {row.buyer.lastName}
                </div>
                <div className="text-xs text-muted-foreground">{row.buyer.email}</div>
              </TableCell>
              {isAdmin ? (
                <TableCell className="text-muted-foreground">
                  {row.vendorName ?? "—"}
                </TableCell>
              ) : null}
              <TableCell className="text-right">{row.quantity}</TableCell>
              <TableCell className="text-right">
                {formatTicketPrice(row.totalAmount, row.currency)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={statusBadgeVariant(row.status)}>
                  {statusLabel(row.status)}
                </Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDateTime(row.purchasedAt)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
