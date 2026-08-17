"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarDays, Pencil, Trash2, Plus, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/venues/StatusBadge";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardErrorAlert,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
} from "@/components/dashboard/dashboard-ui";
import {
  DashboardDataTable,
  DashboardSortableHeader,
  formatTableRangeLabel,
} from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  deleteAttraction,
  listManagedAttractions,
  restoreAttraction,
  updateAttractionStatus,
  type ManagedAttraction,
} from "@/features/attractions/api";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { useTableQueryState } from "@/hooks/use-table-query-state";

function canRestoreManagedListing(
  item: { createdByUserId?: string | null },
  userId: string | undefined,
  scope: "vendor" | "admin",
) {
  if (!userId) return false;
  if (scope === "vendor") return true;
  return item.createdByUserId === userId;
}

export default function ManageAttractions() {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");
  const tTables = useTranslations("tables");
  const paths = useDashboardPaths();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const table = useTableQueryState({
    initialSortBy: "createdAt",
    initialSortOrder: "desc",
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["managed-attractions", table.queryParams],
    queryFn: () =>
      listManagedAttractions({
        ...table.queryParams,
        sortBy: table.sortBy as "createdAt" | "name" | "scheduleStartDate",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAttraction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-attractions"] });
      toast.success(t("attractionDeleted"));
    },
    onError: (e) => toastApiError(e, t("couldNotDeleteAttraction")),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreAttraction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-attractions"] });
      toast.success(t("attractionRestored"));
    },
    onError: (e) => toastApiError(e, t("couldNotRestoreAttraction")),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: {
      id: string;
      status: "APPROVED" | "REJECTED";
    }) => updateAttractionStatus(vars.id, { status: vars.status }),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["managed-attractions"] });
      toast.success(
        vars.status === "APPROVED"
          ? "Attraction approved"
          : "Attraction rejected",
      );
    },
    onError: (e) => toastApiError(e, "Could not update attraction status"),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const showPagination = !isLoading && (meta?.total ?? 0) > 0;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t("myAttractions")}
          action={
            <Button asChild>
              <Link href={paths.addAttraction}>
                <Plus className="mr-2 h-4 w-4" />
                {t("newAttraction")}
              </Link>
            </Button>
          }
        />

        {isError ? (
          <DashboardErrorAlert
            message={
              error instanceof Error ? error.message : t("failedLoadAttractions")
            }
            onRetry={() => void refetch()}
            retryLabel={tCommon("retry")}
          />
        ) : null}

        <DashboardDataTable
          toolbar={{
            search: {
              value: table.search,
              onChange: table.setSearch,
              placeholder: t("searchAttractions"),
            },
            pageSize: {
              value: table.pageSize,
              onChange: table.setPageSize,
            },
            onReset: table.reset,
            showReset: table.hasActiveFilters,
          }}
          pagination={
            showPagination
              ? {
                  label: formatTableRangeLabel({
                    page: table.page,
                    pageSize: table.pageSize,
                    total: meta?.total ?? rows.length,
                    showingLabel: (values) => tTables("showing", values),
                  }),
                  page: table.page,
                  totalPages,
                  total: meta?.total ?? rows.length,
                  onPageChange: table.setPage,
                  previousLabel: tCommon("previous"),
                  nextLabel: tCommon("next"),
                  isLoading,
                }
              : undefined
          }
        >
          <Table
            className={cn(dashboardTableClass, "min-w-[900px]")}
            containerClassName={dashboardTableContainerClass}
          >
            <TableHeader>
              <TableRow className={dashboardTableHeaderRowClass}>
                <DashboardSortableHeader
                  className="min-w-[220px]"
                  label={t("attractionsSection")}
                  column="name"
                  sortBy={table.sortBy}
                  sortOrder={table.sortOrder}
                  onSort={table.toggleSort}
                />
                <DashboardSortableHeader
                  className="min-w-[170px]"
                  label="Next show"
                  column="scheduleStartDate"
                  sortBy={table.sortBy}
                  sortOrder={table.sortOrder}
                  onSort={table.toggleSort}
                />
                <TableHead className="min-w-[120px] whitespace-nowrap text-muted-foreground">
                  {t("tableCity")}
                </TableHead>
                <TableHead className="min-w-[120px] whitespace-nowrap text-muted-foreground">
                  {t("tableStatus")}
                </TableHead>
                <TableHead className="min-w-[140px] whitespace-nowrap text-right text-muted-foreground">
                  {t("tableActions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton cols={5} />
              ) : rows.length === 0 ? (
                <TableEmptyRow colSpan={5}>{t("noAttractionsYet")}</TableEmptyRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className={dashboardTableRowClass}>
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <AttractionThumb attraction={row} />
                        <span className="truncate font-medium">{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatNextShow(row)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.city}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {row.isDeleted ? (
                        <StatusBadge status="DELETED" />
                      ) : row.status ? (
                        <StatusBadge status={row.status} />
                      ) : (
                        tCommon("notAvailable")
                      )}
                      {!row.isDeleted &&
                      paths.scope === "admin" &&
                      row.status === "PENDING" ? (
                        <div className="mt-2 flex gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 px-2 text-xs"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                id: row.id,
                                status: "APPROVED",
                              })
                            }
                          >
                            Approve
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-destructive"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              statusMutation.mutate({
                                id: row.id,
                                status: "REJECTED",
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className={dashboardTableActionsClass}>
                        {!row.isDeleted ? (
                          <>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="Manage schedule"
                              asChild
                            >
                              <Link
                                href={paths.manageAttractionOccurrences(row.id)}
                              >
                                <CalendarDays className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={t("editAttraction")}
                              asChild
                            >
                              <Link href={paths.editAttraction(row.id)}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={t("deleteAttraction")}
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (
                                  !confirm(
                                    t("deleteAttractionConfirm", {
                                      name: row.name,
                                    }),
                                  )
                                )
                                  return;
                                deleteMutation.mutate(row.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : canRestoreManagedListing(row, user?.id, paths.scope) ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={t("restoreAttraction")}
                            disabled={restoreMutation.isPending}
                            onClick={() => {
                              if (
                                !confirm(
                                  t("restoreAttractionConfirm", {
                                    name: row.name,
                                  }),
                                )
                              )
                                return;
                              restoreMutation.mutate(row.id);
                            }}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : null}
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

function AttractionThumb({ attraction }: { attraction: ManagedAttraction }) {
  const src = attraction.thumbnail?.trim() || attraction.coverImage?.trim();

  if (src) {
    return (
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a]">
        <Image src={src} alt="" fill className="object-cover" sizes="44px" />
      </div>
    );
  }

  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#151515] text-muted-foreground">
      <CalendarDays className="h-4 w-4" />
    </div>
  );
}

function formatNextShow(row: ManagedAttraction) {
  const next = row.occurrences?.find((o) => o.status === "SCHEDULED");
  const iso = next?.startDateTime;
  if (iso) {
    try {
      return new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        ...(row.timezone ? { timeZone: row.timezone } : {}),
      });
    } catch {
      return iso;
    }
  }

  // Managed list may omit occurrences — show recurring slot pattern as a fallback.
  const firstSlot = row.slots?.[0];
  if (!firstSlot) return "—";
  return `${firstSlot.name} (${firstSlot.startTime})`;
}
