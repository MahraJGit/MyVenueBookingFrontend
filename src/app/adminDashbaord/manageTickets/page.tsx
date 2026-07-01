"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Banknote, ExternalLink, Loader2, Ticket } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useAuth } from "@/features/auth/auth-context";
import {
  getTicketSales,
  type TicketSaleStatusFilter,
} from "@/features/ticket-purchases/api";
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
  DashboardSearchInput,
  DashboardStatCard,
  dashboardTableClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
  dashboardOutlineButtonClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table";
import {
  DashboardFilterBar,
  DashboardScrollableTabs,
} from "@/components/userDashboard/DashboardScrollableTabs";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
const selectTriggerClass = dashboardSelectTriggerClass;
const selectContentClass = dashboardDropdownContentClass;

type TicketsTab = "by-event" | "sales-log";

function formatDateTime(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}

function statusBadgeVariant(status: string) {
  if (status === "CONFIRMED" || status === "COMPLETED") return "default";
  if (status === "PENDING") return "secondary";
  return "destructive";
}

export default function ManageTicketsPage() {
  const t = useTranslations("adminManageTickets");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("entityStatus");
  const tAdmin = useTranslations("adminDashboard");
  const tListing = useTranslations("listing");
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<TicketsTab>("by-event");
  const [statusFilter, setStatusFilter] =
    useState<TicketSaleStatusFilter>("CONFIRMED");
  const [eventFilter, setEventFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");

  const queryParams = useMemo(
    () => ({
      status: statusFilter,
      eventId: eventFilter === "ALL" ? undefined : eventFilter,
      page,
      limit: PAGE_SIZE,
    }),
    [statusFilter, eventFilter, page],
  );

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["ticket-sales", queryParams],
    queryFn: () => getTicketSales(queryParams),
  });

  const summary = data?.summary ?? [];
  const records = data?.records ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const searchLower = search.trim().toLowerCase();

  const filteredSummary = useMemo(() => {
    if (!searchLower) return summary;
    return summary.filter(
      (row) =>
        row.eventName.toLowerCase().includes(searchLower) ||
        row.vendorName?.toLowerCase().includes(searchLower),
    );
  }, [summary, searchLower]);

  const filteredRecords = useMemo(() => {
    if (!searchLower) return records;
    return records.filter((row) => {
      const buyerName = `${row.buyer.firstName} ${row.buyer.lastName}`.toLowerCase();
      return (
        row.eventName.toLowerCase().includes(searchLower) ||
        row.ticketTypeName.toLowerCase().includes(searchLower) ||
        row.orderCode?.toLowerCase().includes(searchLower) ||
        buyerName.includes(searchLower) ||
        row.buyer.email.toLowerCase().includes(searchLower)
      );
    });
  }, [records, searchLower]);

  const totals = useMemo(() => {
    return filteredSummary.reduce(
      (acc, row) => ({
        tickets: acc.tickets + row.totalTicketsSold,
        revenue: acc.revenue + row.totalRevenue,
      }),
      { tickets: 0, revenue: 0 },
    );
  }, [filteredSummary]);

  const currency =
    filteredSummary[0]?.currency ?? records[0]?.currency ?? "PKR";

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

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, eventFilter]);

  const showSalesPagination =
    activeTab === "sales-log" && !isLoading && (pagination?.total ?? 0) > 0;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t("title")}
          description={isAdmin ? t("descriptionAdmin") : t("descriptionVendor")}
        />

        <DashboardFilterBar
        className={dashboardFilterBarBorderClass}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn("w-full sm:w-auto", dashboardSurfaceBorderClass)}
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              tCommon("refresh")
            )}
          </Button>
        }
      >
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="w-full max-w-sm">
            <DashboardSearchInput
              placeholder={t("searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as TicketSaleStatusFilter)}
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
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className={cn("w-full sm:w-[200px]", selectTriggerClass)}>
              <SelectValue placeholder={tAdmin("tableEvent")} />
            </SelectTrigger>
            <SelectContent className={selectContentClass}>
              <SelectItem value="ALL">{t("allEvents")}</SelectItem>
              {summary.map((ev) => (
                <SelectItem key={ev.eventId} value={ev.eventId}>
                  {ev.eventName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </DashboardFilterBar>

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
        <DashboardScrollableTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={[
            { value: "by-event", label: t("byEvent") },
            { value: "sales-log", label: t("salesLog") },
          ]}
        />
      </DashboardFilterBar>

      <DashboardDataTable
        pagination={
          showSalesPagination
            ? {
                label: tListing("pageOfWithCount", {
                  page: pagination?.page ?? page,
                  totalPages,
                  total: pagination?.total ?? filteredRecords.length,
                  type: t("salesLog").toLowerCase(),
                }),
                page,
                totalPages,
                total: pagination?.total ?? filteredRecords.length,
                onPageChange: setPage,
                previousLabel: tCommon("previous"),
                nextLabel: tCommon("next"),
                isLoading,
              }
            : undefined
        }
      >
        {activeTab === "by-event" ? (
          <ByEventTable
            isAdmin={isAdmin}
            isLoading={isLoading}
            rows={filteredSummary}
            t={t}
            tAdmin={tAdmin}
            tCommon={tCommon}
          />
        ) : (
          <SalesLogTable
            isAdmin={isAdmin}
            isLoading={isLoading}
            rows={filteredRecords}
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

function ByEventTable({
  isAdmin,
  isLoading,
  rows,
  t,
  tAdmin,
  tCommon,
}: {
  isAdmin: boolean;
  isLoading: boolean;
  rows: Awaited<ReturnType<typeof getTicketSales>>["summary"];
  t: ReturnType<typeof useTranslations<"adminManageTickets">>;
  tAdmin: ReturnType<typeof useTranslations<"adminDashboard">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const colSpan = isAdmin ? 8 : 7;

  return (
    <Table className={dashboardTableClass} containerClassName="overflow-visible">
      <TableHeader>
        <TableRow className={dashboardTableHeaderRowClass}>
          <TableHead className="text-muted-foreground">{tAdmin("tableEvent")}</TableHead>
          {isAdmin ? (
            <TableHead className="text-muted-foreground">{tCommon("vendor")}</TableHead>
          ) : null}
          <TableHead className="text-muted-foreground">{tCommon("date")}</TableHead>
          <TableHead className="text-muted-foreground">{t("ticketType")}</TableHead>
          <TableHead className="text-right text-muted-foreground">{tCommon("sold")}</TableHead>
          <TableHead className="text-right text-muted-foreground">
            {tCommon("inventory")}
          </TableHead>
          <TableHead className="text-right text-muted-foreground">
            {tCommon("revenue")}
          </TableHead>
          <TableHead className="text-muted-foreground" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableSkeleton cols={colSpan} />
        ) : rows.length === 0 ? (
          <TableEmptyRow colSpan={colSpan}>{t("noTicketSales")}</TableEmptyRow>
        ) : (
          rows.flatMap((event) =>
            event.ticketTypes.length > 0
              ? event.ticketTypes.map((tt, idx) => (
                  <TableRow
                    key={`${event.eventId}-${tt.ticketTypeId}`}
                    className={dashboardTableRowClass}
                  >
                    <TableCell className="font-medium">{idx === 0 ? event.eventName : ""}</TableCell>
                    {isAdmin ? (
                      <TableCell className="text-muted-foreground">
                        {idx === 0 ? (event.vendorName ?? "—") : ""}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-muted-foreground">
                      {idx === 0 ? formatDateTime(event.eventStartDateTime) : ""}
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
                          <Link href={`/events/${event.eventSlug}`} target="_blank">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              : [
                  <TableRow key={event.eventId} className={dashboardTableRowClass}>
                    <TableCell className="font-medium">{event.eventName}</TableCell>
                    {isAdmin ? (
                      <TableCell className="text-muted-foreground">
                        {event.vendorName ?? "—"}
                      </TableCell>
                    ) : null}
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(event.eventStartDateTime)}
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
                        <Link href={`/events/${event.eventSlug}`} target="_blank">
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
  rows: Awaited<ReturnType<typeof getTicketSales>>["records"];
  statusLabel: (status: string) => string;
  t: ReturnType<typeof useTranslations<"adminManageTickets">>;
  tAdmin: ReturnType<typeof useTranslations<"adminDashboard">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}) {
  const colSpan = isAdmin ? 9 : 8;

  return (
    <Table className={dashboardTableClass} containerClassName="overflow-visible">
      <TableHeader>
        <TableRow className={dashboardTableHeaderRowClass}>
          <TableHead className="text-muted-foreground">{tCommon("order")}</TableHead>
          <TableHead className="text-muted-foreground">{tAdmin("tableEvent")}</TableHead>
          <TableHead className="text-muted-foreground">{t("ticketType")}</TableHead>
          <TableHead className="text-muted-foreground">{t("buyer")}</TableHead>
          {isAdmin ? (
            <TableHead className="text-muted-foreground">{tCommon("vendor")}</TableHead>
          ) : null}
          <TableHead className="text-right text-muted-foreground">{tCommon("qty")}</TableHead>
          <TableHead className="text-right text-muted-foreground">{tCommon("amount")}</TableHead>
          <TableHead className="text-muted-foreground">{tCommon("status")}</TableHead>
          <TableHead className="text-muted-foreground">{tCommon("purchased")}</TableHead>
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
              <TableCell className="font-medium">{row.eventName}</TableCell>
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
              <TableCell>
                <Badge variant={statusBadgeVariant(row.status)}>
                  {statusLabel(row.status)}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDateTime(row.purchasedAt)}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
