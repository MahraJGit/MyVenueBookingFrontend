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
  listAdminCorporateOrganizations,
  type OrganizationStatus,
} from "@/features/corporate-admin/api";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | OrganizationStatus;

function statusBadgeVariant(status: OrganizationStatus) {
  if (status === "APPROVED") return "default";
  if (status === "REJECTED" || status === "SUSPENDED") return "destructive";
  return "secondary";
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString();
}

function ownerFromOrg(org: {
  members: Array<{ corporateUser: { firstName: string; lastName: string; email: string } }>;
}) {
  const owner = org.members[0]?.corporateUser;
  if (!owner) return "—";
  const name = `${owner.firstName} ${owner.lastName}`.trim();
  return name || owner.email;
}

export default function CorporateOrganizationsPage() {
  const t = useTranslations("adminCorporateOrganizations");
  const tCommon = useTranslations("common");
  const tTables = useTranslations("tables");

  const table = useTableQueryState<{ status: StatusFilter }>({
    initialFilters: { status: "PENDING" },
  });

  const statusLabel = (status: OrganizationStatus) => {
    if (status === "APPROVED") return t("statusApproved");
    if (status === "REJECTED") return t("statusRejected");
    if (status === "SUSPENDED") return t("statusSuspended");
    return t("statusPending");
  };

  const {
    data: listResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-corporate-orgs", table.queryParams],
    queryFn: () =>
      listAdminCorporateOrganizations({
        page: table.queryParams.page,
        limit: table.queryParams.limit,
        status:
          table.filters.status === "ALL"
            ? undefined
            : (table.filters.status as OrganizationStatus),
      }),
  });

  const errorMessage = useMemo(() => {
    if (!isError || !error) return null;
    return error instanceof Error ? error.message : t("failedLoad");
  }, [isError, error, t]);

  const organizations = listResult?.data ?? [];
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
            ["ALL", "PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const
          ).map((value) => ({
            value,
            label:
              value === "ALL"
                ? tCommon("all")
                : statusLabel(value as OrganizationStatus),
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
            className={cn(dashboardTableClass, "min-w-[960px]")}
            containerClassName={dashboardTableContainerClass}
          >
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <TableHead className="min-w-[180px] text-muted-foreground">
                  {t("organization")}
                </TableHead>
                <TableHead className="min-w-[140px] text-muted-foreground">
                  {tCommon("owner")}
                </TableHead>
                <TableHead className="min-w-[200px] text-muted-foreground">
                  {tCommon("email")}
                </TableHead>
                <TableHead className="min-w-[110px] text-muted-foreground">
                  {tCommon("status")}
                </TableHead>
                <TableHead className="min-w-[90px] text-muted-foreground">
                  {t("attempts")}
                </TableHead>
                <TableHead className="min-w-[110px] text-muted-foreground">
                  {tCommon("submitted")}
                </TableHead>
                <TableHead className="min-w-[120px] text-right text-muted-foreground">
                  {tCommon("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={7} />
              ) : organizations.length === 0 ? (
                <TableRow className={dashboardTableRowClass}>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    {t("noResults")}
                  </TableCell>
                </TableRow>
              ) : (
                organizations.map((org) => {
                  const owner = org.members[0]?.corporateUser;
                  return (
                    <TableRow key={org.id} className={dashboardTableRowClass}>
                      <TableCell className="max-w-[220px] whitespace-normal break-words font-medium">
                        {org.name}
                      </TableCell>
                      <TableCell className="max-w-[160px] whitespace-normal break-words">
                        {ownerFromOrg(org)}
                      </TableCell>
                      <TableCell
                        className="max-w-[240px] truncate text-muted-foreground"
                        title={owner?.email}
                      >
                        {owner?.email ?? "—"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant={statusBadgeVariant(org.status)}>
                          {statusLabel(org.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {org.submissionCount}
                        {meta?.maxSubmissions != null ? ` / ${meta.maxSubmissions}` : ""}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(org.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className={dashboardTableActionsClass}>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className={cn("shrink-0", dashboardOutlineButtonClass)}
                          >
                            <Link href={`/adminDashbaord/corporateOrganizations/${org.id}`}>
                              <Eye className="h-4 w-4" />
                              {tCommon("view")}
                            </Link>
                          </Button>
                        </div>
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
