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
import { CalendarDays, Eye, Pencil, Trash2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  deleteEvent,
  listManagedEvents,
  type ManagedEvent,
} from "@/features/events/api";
import { toastApiError } from "@/lib/toasts";
import { format } from "date-fns";
import { useDashboardPaths } from "@/features/dashboard/paths";

const PAGE_SIZE = 10;

export default function ManageEvents() {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");
  const tListing = useTranslations("listing");
  const paths = useDashboardPaths();
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

        <div className="w-full sm:max-w-xs">
          <DashboardSearchInput
            placeholder={t("searchEvents")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{error instanceof Error ? error.message : t("failedLoadEvents")}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                {tCommon("retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-[#242424]">
          <Table className="[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3">
            <TableHeader>
              <TableRow className="border-[#242424] hover:bg-transparent">
                <TableHead className="min-w-[220px] text-muted-foreground">{t("tableEvent")}</TableHead>
                <TableHead className="text-muted-foreground">{t("tableStarts")}</TableHead>
                <TableHead className="text-muted-foreground">{t("tableCity")}</TableHead>
                <TableHead className="text-muted-foreground">{t("tableStatus")}</TableHead>
                <TableHead className="text-right text-muted-foreground">{t("tableActions")}</TableHead>
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
                    className="border-[#242424] hover:bg-[#151515]/80"
                  >
                    <TableCell>
                      <div className="flex min-w-0 items-center gap-3">
                        <EventThumb event={ev} />
                        <span className="truncate font-medium">{ev.eventName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDateSafe(ev.startDateTime)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ev.city}</TableCell>
                    <TableCell>
                      {ev.status ? (
                        <StatusBadge status={ev.status} />
                      ) : (
                        tCommon("notAvailable")
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
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
                                t("deleteEventConfirm", { name: ev.eventName }),
                              )
                            )
                              return;
                            deleteMutation.mutate(ev.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {showPagination ? (
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {tListing("pageOfWithCount", {
                page: meta?.page ?? page,
                totalPages,
                total: meta?.total ?? rows.length,
                type: tListing("eventsCount"),
              })}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#242424]"
                disabled={page <= 1 || isLoading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {tCommon("previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[#242424]"
                disabled={page >= totalPages || isLoading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                {tCommon("next")}
              </Button>
            </div>
          </div>
        ) : null}
      </DashboardPanel>

      <EventPublicPreviewDialog
        event={viewEvent}
        onClose={() => setViewEvent(null)}
        editHref={viewEvent ? paths.editEvent(viewEvent.id) : undefined}
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

function formatDateSafe(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}
