"use client";

/**
 * Event management: data table + actions (previous card grid removed — use git history if needed).
 */

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarDays, Eye, Pencil, Trash2, Plus, Armchair, Ticket, RotateCcw } from "lucide-react";

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
import { EventPublicPreviewDialog } from "@/components/events/EventPublicPreviewDialog";
import {
  DashboardPanel,
  DashboardPageShell,
  DashboardSearchInput,
  DashboardErrorAlert,
  dashboardTableClass,
  dashboardTableContainerClass,
  dashboardTableActionsClass,
  dashboardTableHeaderRowClass,
  dashboardTableRowClass,
  dashboardSelectTriggerClass,
  dashboardDropdownContentClass,
} from "@/components/dashboard/dashboard-ui";
import { DashboardDataTable } from "@/components/dashboard/dashboard-data-table";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  deleteEvent,
  listManagedEvents,
  restoreEvent,
  type ManagedEvent,
} from "@/features/events/api";
import { useAuth } from "@/features/auth/auth-context";
import { toastApiError } from "@/lib/toasts";
import { cn } from "@/lib/utils";
import { useDashboardPaths } from "@/features/dashboard/paths";

const PAGE_SIZE = 10;

function canRestoreManagedListing(
  item: { createdByUserId?: string | null },
  userId: string | undefined,
  scope: "vendor" | "admin",
) {
  if (!userId) return false;
  if (scope === "vendor") return true;
  return item.createdByUserId === userId;
}

export default function ManageEvents() {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");
  const tListing = useTranslations("listing");
  const paths = useDashboardPaths();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [viewEvent, setViewEvent] = useState<ManagedEvent | null>(null);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["managed-events", search, page],
    queryFn: () =>
      listManagedEvents({
        page,
        limit: PAGE_SIZE,
        ...(search.trim() ? { search: search.trim() } : {}),
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-events"] });
      toast.success(t("eventDeleted"));
    },
    onError: (e) => toastApiError(e, t("couldNotDeleteEvent")),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-events"] });
      toast.success(t("eventRestored"));
    },
    onError: (e) => toastApiError(e, t("couldNotRestoreEvent")),
  });

  const rows = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const showPagination = !isLoading && (meta?.total ?? 0) > 0;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title={t("myEvents")}
          action={
            <Button asChild>
              <Link href={paths.addEvent}>
                <Plus className="mr-2 h-4 w-4" />
                {t("newEvent")}
              </Link>
            </Button>
          }
        />

        <div className="w-full max-w-sm">
          <DashboardSearchInput
            placeholder={t("searchEvents")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isError ? (
          <DashboardErrorAlert
            message={error instanceof Error ? error.message : t("failedLoadEvents")}
            onRetry={() => void refetch()}
            retryLabel={tCommon("retry")}
          />
        ) : null}

        <DashboardDataTable
          pagination={
            showPagination
              ? {
                  label: tListing("pageOfWithCount", {
                    page: meta?.page ?? page,
                    totalPages,
                    total: meta?.total ?? rows.length,
                    type: tListing("eventsCount"),
                  }),
                  page,
                  totalPages,
                  total: meta?.total ?? rows.length,
                  onPageChange: setPage,
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
                <TableHead className="min-w-[220px] whitespace-nowrap text-muted-foreground">
                  {t("tableEvent")}
                </TableHead>
                <TableHead className="min-w-[170px] whitespace-nowrap text-muted-foreground">
                  {t("tableStarts")}
                </TableHead>
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
                <TableEmptyRow colSpan={5}>
                  {t("noEventsYet")}
                </TableEmptyRow>
              ) : (
                rows.map((ev) => (
                  <TableRow
                    key={ev.id}
                    className={dashboardTableRowClass}
                  >
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <EventThumb event={ev} />
                        <span className="truncate font-medium">{ev.eventName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateSafe(ev.startDateTime, ev.timezone)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ev.city}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {ev.isDeleted ? (
                        <StatusBadge status="DELETED" />
                      ) : ev.status ? (
                        <StatusBadge status={ev.status} />
                      ) : (
                        tCommon("notAvailable")
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <div className={dashboardTableActionsClass}>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={t("viewEvent")}
                          onClick={() => setViewEvent(ev)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {!ev.isDeleted ? (
                          <>
                            {ev.seatingEnabled ? (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Manage seating"
                                asChild
                              >
                                <Link href={paths.manageEventSeating(ev.id)}>
                                  <Armchair className="h-4 w-4" />
                                </Link>
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Manage ticket quantity"
                                asChild
                              >
                                <Link href={paths.manageEventQuantity(ev.id)}>
                                  <Ticket className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={t("editEvent")}
                              asChild
                            >
                              <Link href={paths.editEvent(ev.id)}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              aria-label={t("deleteEvent")}
                              disabled={deleteMutation.isPending}
                              onClick={() => {
                                if (
                                  !confirm(
                                    t("deleteEventConfirm", {
                                      name: ev.eventName,
                                    }),
                                  )
                                )
                                  return;
                                deleteMutation.mutate(ev.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : canRestoreManagedListing(ev, user?.id, paths.scope) ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={t("restoreEvent")}
                            disabled={restoreMutation.isPending}
                            onClick={() => {
                              if (
                                !confirm(
                                  t("restoreEventConfirm", {
                                    name: ev.eventName,
                                  }),
                                )
                              )
                                return;
                              restoreMutation.mutate(ev.id);
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

      <EventPublicPreviewDialog
        event={viewEvent}
        onClose={() => setViewEvent(null)}
        editHref={
          viewEvent && !viewEvent.isDeleted
            ? paths.editEvent(viewEvent.id)
            : undefined
        }
      />
    </DashboardPageShell>
  );
}

function EventThumb({ event }: { event: ManagedEvent }) {
  const src = event.thumbnail?.trim() || event.coverImage?.trim();

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

function formatDateSafe(iso: string, timeZone?: string | null) {
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
