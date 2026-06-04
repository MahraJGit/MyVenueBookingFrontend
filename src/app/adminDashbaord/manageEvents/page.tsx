"use client";

/**
 * Event management: data table + actions (previous card grid removed — use git history if needed).
 */

import React, { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  Search,
  Loader2,
  Calendar as CalendarIcon,
  MapPin,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  deleteEvent,
  listManagedEvents,
  type EventApprovalStatus,
  type ManagedEvent,
} from "@/features/events/api";
import { toastApiError } from "@/lib/toasts";
import { format } from "date-fns";

export default function ManageEvents() {
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
      toast.success("Event deleted");
    },
    onError: (e) => toastApiError(e, "Could not delete event."),
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
            My Events
          </h2>

          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70"
              />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-none bg-primary/20 pl-10 text-white placeholder:text-zinc-500"
              />
            </div>
            <Button
              asChild
              className="bg-primary text-black hover:bg-primary/90"
            >
              <Link href="/adminDashbaord/addEvents">
                <Plus className="mr-2 h-4 w-4" />
                New event
              </Link>
            </Button>
          </div>
        </div>

        {isError ? (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-100">
            <p>{error instanceof Error ? error.message : "Failed to load events."}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 border-red-400 text-red-100"
              onClick={() => void refetch()}
            >
              Retry
            </Button>
          </div>
        ) : null}

        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead>Event</TableHead>
                <TableHead>Starts</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-zinc-400"
                  >
                    No events yet. Create one with &quot;New event&quot; to see it here.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((ev) => (
                  <TableRow
                    key={ev.id}
                    className="border-zinc-800 hover:bg-zinc-900/40"
                  >
                    <TableCell className="max-w-[220px] font-medium">
                      {ev.eventName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-zinc-300">
                      {formatDateSafe(ev.startDateTime)}
                    </TableCell>
                    <TableCell>{ev.city}</TableCell>
                    <TableCell>
                      <Badge variant={eventStatusBadgeVariant(ev.status)}>
                        {eventStatusLabel(ev.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-zinc-300 hover:text-white"
                          aria-label="View event"
                          onClick={() => setViewEvent(ev)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-zinc-300 hover:text-white"
                          aria-label="Edit event"
                          asChild
                        >
                          <Link
                            href={`/adminDashbaord/addEvents?id=${encodeURIComponent(ev.id)}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300"
                          aria-label="Delete event"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (
                              !confirm(
                                `Delete "${ev.eventName}"? This cannot be undone.`,
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
      </div>

      <Dialog open={Boolean(viewEvent)} onOpenChange={(o) => !o && setViewEvent(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-700 bg-[#111] text-white">
          <DialogHeader>
            <DialogTitle>{viewEvent?.eventName}</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Event summary (read-only)
            </DialogDescription>
          </DialogHeader>
          {viewEvent ? (
            <div className="space-y-5 text-sm">
              <section className="space-y-2 rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Basic
                </p>
                <p>
                  <span className="text-zinc-500">Category:</span>{" "}
                  {viewEvent.category ?? "—"}
                </p>
                <p>
                  <span className="text-zinc-500">Status:</span>{" "}
                  {viewEvent.status ?? "—"}
                </p>
                <p>
                  <span className="text-zinc-500">Slug:</span>{" "}
                  <code className="rounded bg-zinc-900 px-1">{viewEvent.slug}</code>
                </p>
                <p className="text-zinc-400">
                  {viewEvent.eventDescription || "No description provided."}
                </p>
              </section>

              <section className="space-y-2 rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Schedule
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
                  Venue & Location
                </p>
                <p>
                  <span className="text-zinc-500">Venue name:</span>{" "}
                  {viewEvent.venueName ?? "—"}
                </p>
                <p>
                  <span className="text-zinc-500">Venue phone:</span>{" "}
                  {viewEvent.venuePhone ?? "—"}
                </p>
                <p>
                  <span className="text-zinc-500">Venue website:</span>{" "}
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
                    "—"
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
                  Lat/Lng: {String(viewEvent.latitude)}, {String(viewEvent.longitude)}
                </p>
                <p className="text-zinc-400">
                  Location source: {viewEvent.locationSource}
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
                  Tags
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
                  <p className="text-zinc-400">No tags.</p>
                )}
              </section>

              <section className="space-y-2 rounded-lg border border-zinc-800 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Ticket types
                </p>
                {viewEvent.ticketTypes.length ? (
                  <ul className="list-inside list-disc space-y-1 text-zinc-300">
                    {viewEvent.ticketTypes.map((t) => (
                      <li key={t.id ?? t.name}>
                        {t.name} — {t.currency} {String(t.price)} × {t.quantityTotal}{" "}
                        total
                        {typeof t.quantitySold === "number"
                          ? ` (${t.quantitySold} sold)`
                          : ""}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-400">No ticket types.</p>
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
  return (
    <section className="space-y-4 rounded-lg border border-zinc-800 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        Media
      </p>

      {coverImage ? (
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">Cover</p>
          <button
            type="button"
            onClick={() => onOpenFull(coverImage)}
            className="group block overflow-hidden rounded-md border border-zinc-700 transition hover:border-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="Cover"
              className="max-h-48 w-full object-cover transition group-hover:opacity-80"
            />
          </button>
        </div>
      ) : (
        <p className="text-zinc-400 text-sm">No cover image.</p>
      )}

      {thumbnail ? (
        <div className="space-y-1.5">
          <p className="text-xs text-zinc-500">Thumbnail</p>
          <button
            type="button"
            onClick={() => onOpenFull(thumbnail)}
            className="group block overflow-hidden rounded-md border border-zinc-700 transition hover:border-primary"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt="Thumbnail"
              className="h-24 w-32 object-cover transition group-hover:opacity-80"
            />
          </button>
        </div>
      ) : null}

      {gallery?.length ? (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Gallery ({gallery.length})</p>
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
                  alt={`Gallery ${idx + 1}`}
                  className="h-full w-full object-cover transition group-hover:opacity-80"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-zinc-400 text-sm">No gallery images.</p>
      )}
    </section>
  );
}

function eventStatusBadgeVariant(status: EventApprovalStatus | undefined) {
  if (status === "APPROVED" || status === "ACTIVE") return "default";
  if (status === "REJECTED") return "destructive";
  return "secondary";
}

function eventStatusLabel(status: EventApprovalStatus | undefined) {
  if (!status) return "—";
  if (status === "PENDING") return "Pending";
  if (status === "APPROVED") return "Approved";
  if (status === "REJECTED") return "Rejected";
  return status;
}

function formatDateSafe(iso: string) {
  try {
    return format(new Date(iso), "MMM d, yyyy h:mm a");
  } catch {
    return iso;
  }
}
