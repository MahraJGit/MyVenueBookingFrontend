"use client";

/**
 * Event management: data table + actions (previous card grid removed — use git history if needed).
 */

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TableEmptyRow, TableSkeleton } from "@/components/ui/table-skeleton";
import { TableShell } from "@/components/ui/table-shell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/venues/StatusBadge";
import {
  deleteEvent,
  listManagedEvents,
  type ManagedEvent,
} from "@/features/events/api";
import { toastApiError } from "@/lib/toasts";
import { format } from "date-fns";
import { useDashboardPaths } from "@/features/dashboard/paths";

export default function ManageEvents() {
  const t = useTranslations("adminDashboard");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const paths = useDashboardPaths();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [viewEvent, setViewEvent] = useState<ManagedEvent | null>(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["managed-events", search],
    queryFn: () =>
      listManagedEvents({
        page: 1,
        limit: 100,
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

  const openMediaMutation = {
    mutate: (fileUrl: string) => {
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    },
  };

  const rows = data?.data ?? [];

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="w-full space-y-6 rounded-2xl bg-[#0e0e0e] p-6 text-white">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <h2 className="w-full text-xl font-bold text-primary lg:w-auto">
            {t("myEvents")}
          </h2>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
              />
              <Input
                placeholder={t("searchEvents")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none bg-primary/20 pl-10 text-white placeholder:text-zinc-500"
              />
            </div>
            <Button
              asChild
              className="bg-primary text-black hover:bg-primary/90"
            >
              <Link href={paths.addEvent}>
                <Plus className="mr-2 h-4 w-4" />
                {t("newEvent")}
              </Link>
            </Button>
          </div>
        </div>

        {isError ? (
          <Alert variant="destructive">
            <AlertDescription className="flex flex-wrap items-center gap-3">
              <span>{error instanceof Error ? error.message : t("failedLoadEvents")}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                {tCommon("retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <TableShell>
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">{t("tableEvent")}</TableHead>
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
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="max-w-[220px] font-medium">
                      {ev.eventName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-zinc-300">
                      {formatDateSafe(ev.startDateTime)}
                    </TableCell>
                    <TableCell>{ev.city}</TableCell>
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
                          className="text-zinc-300 hover:text-white"
                          aria-label={t("viewEvent")}
                          onClick={() => setViewEvent(ev)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-zinc-300 hover:text-white"
                          aria-label={t("editEvent")}
                          asChild
                        >
                          <Link
                            href={paths.editEvent(ev.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
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
        </TableShell>
      </div>

      <Dialog open={Boolean(viewEvent)} onOpenChange={(o) => !o && setViewEvent(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-700 bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>{viewEvent?.eventName}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              {t("eventSummary")}
            </DialogDescription>
          </DialogHeader>
          {viewEvent ? (
            <div className="space-y-5 text-sm">
              <section className="space-y-2 rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("basic")}
                </p>
                <p>
                  <span className="text-zinc-500">{t("categoryLabel")}</span>{" "}
                  {viewEvent.category ?? tCommon("notAvailable")}
                </p>
                <p>
                  <span className="text-zinc-500">{t("statusLabel")}</span>{" "}
                  {viewEvent.status ? (
                    <StatusBadge status={viewEvent.status} />
                  ) : (
                    tCommon("notAvailable")
                  )}
                </p>
                <p>
                  <span className="text-zinc-500">{t("slugLabel")}</span>{" "}
                  <code className="rounded bg-zinc-900 px-1">{viewEvent.slug}</code>
                </p>
                <p className="text-zinc-400">
                  {viewEvent.eventDescription || t("noDescriptionProvided")}
                </p>
              </section>

              <section className="space-y-2 rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("scheduleLabel")}
                </p>
                <p className="flex items-start gap-2 text-zinc-300">
                  <CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {formatDateSafe(viewEvent.startDateTime)} →{" "}
                    {formatDateSafe(viewEvent.endDateTime)}
                    <span className="text-zinc-500"> ({viewEvent.timezone})</span>
                  </span>
                </p>
              </section>

              <section className="space-y-2 rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("venueAndLocation")}
                </p>
                <p>
                  <span className="text-zinc-500">{t("venueNameLabel")}</span>{" "}
                  {viewEvent.venueName ?? tCommon("notAvailable")}
                </p>
                <p>
                  <span className="text-zinc-500">{t("venuePhoneLabel")}</span>{" "}
                  {viewEvent.venuePhone ?? tCommon("notAvailable")}
                </p>
                <p>
                  <span className="text-zinc-500">{t("venueWebsiteLabel")}</span>{" "}
                  {viewEvent.venueWebsite ? (
                    <a
                      href={viewEvent.venueWebsite}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      {viewEvent.venueWebsite}
                    </a>
                  ) : (
                    tCommon("notAvailable")
                  )}
                </p>
                <p className="flex items-start gap-2 text-zinc-300">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>
                    {viewEvent.city}, {viewEvent.countryCode}
                    {viewEvent.state ? `, ${viewEvent.state}` : ""}
                    {viewEvent.address ? ` · ${viewEvent.address}` : ""}
                    {viewEvent.zipCode ? ` (${viewEvent.zipCode})` : ""}
                  </span>
                </p>
                <p className="text-zinc-400">
                  {t("latLngLabel")} {String(viewEvent.latitude)}, {String(viewEvent.longitude)}
                </p>
                <p className="text-zinc-400">
                  {t("locationSourceLabel")} {viewEvent.locationSource}
                </p>
              </section>

              <EventMediaPreview
                coverImage={viewEvent.coverImage}
                thumbnail={viewEvent.thumbnail}
                gallery={viewEvent.gallery}
                onOpenFull={(url) => openMediaMutation.mutate(url)}
              />

              <section className="space-y-2 rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {tForms("tags")}
                </p>
                {viewEvent.tags?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {viewEvent.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-zinc-600 px-2 py-0.5 text-xs text-zinc-300"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-400">{t("noTags")}</p>
                )}
              </section>

              <section className="space-y-2 rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  {t("ticketTypes")}
                </p>
                {viewEvent.ticketTypes.length ? (
                  <ul className="list-inside list-disc space-y-1 text-zinc-300">
                    {viewEvent.ticketTypes.map((ticket) => (
                      <li key={ticket.id ?? ticket.name}>
                        {ticket.name} — {ticket.currency} {String(ticket.price)} × {ticket.quantityTotal}{" "}
                        {t("totalLabel")}
                        {typeof ticket.quantitySold === "number"
                          ? ` (${ticket.quantitySold} ${t("soldLabel")})`
                          : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-400">{t("noTicketTypes")}</p>
                )}
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventMediaPreview({
  coverImage,
  thumbnail,
  gallery,
  onOpenFull,
}: {
  coverImage?: string | null;
  thumbnail?: string | null;
  gallery?: string[] | null;
  onOpenFull: (fileUrl: string) => void;
}) {
  const t = useTranslations("adminDashboard");
  const tForms = useTranslations("forms");

  return (
    <section className="space-y-4 rounded-lg border border-zinc-800 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t("mediaLabel")}
      </p>

      {coverImage ? (
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">{t("coverLabel")}</p>
          <button
            type="button"
            onClick={() => onOpenFull(coverImage)}
            className="group block overflow-hidden rounded-md border border-zinc-700 transition hover:border-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt={tForms("coverImage")}
              className="max-h-48 w-full object-cover transition group-hover:opacity-80"
            />
          </button>
        </div>
      ) : (
        <p className="text-zinc-400 text-sm">{t("noCoverImage")}</p>
      )}

      {thumbnail ? (
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">{t("thumbnailLabel")}</p>
          <button
            type="button"
            onClick={() => onOpenFull(thumbnail)}
            className="group block overflow-hidden rounded-md border border-zinc-700 transition hover:border-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt={tForms("thumbnail")}
              className="h-24 w-32 object-cover transition group-hover:opacity-80"
            />
          </button>
        </div>
      ) : null}

      {gallery?.length ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">{t("galleryCount", { count: gallery.length })}</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {gallery.map((g, idx) => (
              <button
                key={`${g}-${idx}`}
                type="button"
                onClick={() => onOpenFull(g)}
                className="group relative aspect-square overflow-hidden rounded-md border border-zinc-700 transition hover:border-primary"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={g}
                  alt={t("galleryImageAlt", { index: idx + 1 })}
                  className="h-full w-full object-cover transition group-hover:opacity-80"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-zinc-400 text-sm">{t("noGalleryImages")}</p>
      )}
    </section>
  );
}

function formatDateSafe(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}
