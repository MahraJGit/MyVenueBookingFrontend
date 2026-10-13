"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardScrollableTabs,
  DashboardErrorAlert,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardOutlineButtonClass,
} from "@/components/dashboard/dashboard-ui";
import {
  DashboardDataTable,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useTableQueryState } from "@/hooks/use-table-query-state";
import {
  listAdminCorporateEvents,
  type CorporateEventStatus,
} from "@/features/corporate-admin/api";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | CorporateEventStatus;

function statusBadgeVariant(status: CorporateEventStatus) {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED" || status === "CANCELLED") return "destructive";
  return "secondary";
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString();
}

export default function AdminCorporateEventsPage() {
  const t = useTranslations("adminCorporateEvents");
  const tCommon = useTranslations("common");
  const tTables = useTranslations("tables");

  const table = useTableQueryState<{ status: StatusFilter }>({
    initialFilters: { status: "ALL" },
  });

  const statusLabel = (status: CorporateEventStatus) => {
    if (status === "APPROVED") return t("statusApproved");
    if (status === "REJECTED") return t("statusRejected");
    if (status === "CANCELLED") return t("statusCancelled");
    if (status === "PENDING_APPROVAL") return t("statusPendingApproval");
    return t("statusDraft");
  };

  const {
    data: listResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-corporate-events", table.queryParams],
    queryFn: () =>
      listAdminCorporateEvents({
        page: table.queryParams.page,
        limit: table.queryParams.limit,
        status:
          table.filters.status === "ALL"
            ? undefined
            : (table.filters.status as CorporateEventStatus),
      }),
  });

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    return error instanceof Error ? error.message : t("failedLoad");
  }, [isError, error, t]);

  const events = listResult?.data ?? [];
  const meta = listResult?.meta;
  const total = meta?.total ?? 0;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader title={t("title")} description={t("description")} />

        <DashboardScrollableTabs
          value={table.filters.status}
          onValueChange={(value) => table.setFilter("status", value as StatusFilter)}
          items={(
            [
              "ALL",
              "DRAFT",
              "PENDING_APPROVAL",
              "APPROVED",
              "REJECTED",
              "CANCELLED",
            ] as const
          ).map((value) => ({
            value,
            label:
              value === "ALL"
                ? tCommon("all")
                : statusLabel(value as CorporateEventStatus),
          }))}
        />

        {errorMessage ? (
          <DashboardErrorAlert
            message={errorMessage}
            onRetry={() => void refetch()}
            retryLabel={tCommon("retry")}
          />
        ) : null}

        <DashboardDataTable
          toolbar={{
            pageSize: { value: table.pageSize, onChange: table.setPageSize },
            onReset: table.reset,
            showReset: table.hasActiveFilters,
            isRefreshing: isFetching && !isLoading,
          }}
          pagination={{
            label: formatTableRangeLabel({
              page: table.page,
              pageSize: table.pageSize,
              total,
              showingLabel: (args) => tTables("showing", args),
            }),
            page: table.page,
            totalPages,
            total,
            onPageChange: table.setPage,
            previousLabel: tCommon("previous"),
            nextLabel: tCommon("next"),
            isLoading,
          }}
        >
          <Table
            className={cn(dashboardTableClass, "min-w-[1100px]")}
            containerClassName={dashboardTableContainerClass}
          >
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <TableHead className="min-w-[180px] text-muted-foreground">
                  {t("event")}
                </TableHead>
                <TableHead className="min-w-[160px] text-muted-foreground">
                  {t("organization")}
                </TableHead>
                <TableHead className="min-w-[110px] text-muted-foreground">
                  {tCommon("status")}
                </TableHead>
                <TableHead className="min-w-[120px] text-muted-foreground">
                  {t("proposedDates")}
                </TableHead>
                <TableHead className="min-w-[140px] text-muted-foreground">
                  {t("location")}
                </TableHead>
                <TableHead className="min-w-[100px] text-muted-foreground">
                  {t("budget")}
                </TableHead>
                <TableHead className="min-w-[110px] text-muted-foreground">
                  {tCommon("created")}
                </TableHead>
                <TableHead className="min-w-[120px] text-right text-muted-foreground">
                  {tCommon("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={8} />
              ) : events.length === 0 ? (
                <TableRow className={dashboardTableRowClass}>
                  <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className={dashboardTableRowClass}>
                    <TableCell className="max-w-[220px] whitespace-normal break-words font-medium">
                      {event.title}
                    </TableCell>
                    <TableCell className="max-w-[180px] whitespace-normal break-words">
                      {event.organization ? (
                        <Link
                          href={`/adminDashbaord/corporateOrganizations/${event.organization.id}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {event.organization.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={statusBadgeVariant(event.status)}>
                        {statusLabel(event.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(event.proposedStartAt)}
                      {event.proposedEndAt
                        ? ` – ${formatDate(event.proposedEndAt)}`
                        : ""}
                    </TableCell>
                    <TableCell className="max-w-[180px] whitespace-normal break-words text-muted-foreground">
                      {event.locationPreference || "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {event.allocatedAmount} {event.currency}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(event.createdAt)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className={dashboardTableActionsClass}>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className={cn("shrink-0", dashboardOutlineButtonClass)}
                        >
                          <Link href={`/adminDashbaord/corporateEvents/${event.id}`}>
                            <Eye className="h-4 w-4" />
                            {tCommon("view")}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DashboardDataTable>
      </DashboardPanel>
    </DashboardPageShell>
  );
}
