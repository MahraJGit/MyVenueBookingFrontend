"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Armchair,
  ArrowLeft,
  Ban,
  CheckCircle2,
  Loader2,
  Store,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DashboardPageShell,
  DashboardPanel,
  DashboardErrorAlert,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import { InventorySeatMap } from "@/components/seating/InventorySeatMap";
import {
  applyAttractionSeatingInventory,
  getManagedAttractionOccurrenceSeating,
} from "@/features/attraction-seating/api";
import type {
  ManagedInventorySeat,
  ManagedSeatingLayout,
  SeatingInventoryAction,
} from "@/features/seating/api";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { toastApiError } from "@/lib/toasts";

export function ManageAttractionOccurrenceSeatingContent() {
  const params = useParams<{ id: string; occurrenceId: string }>();
  const attractionId = params.id;
  const occurrenceId = params.occurrenceId;
  const paths = useDashboardPaths();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");

  const seatingQuery = useQuery({
    queryKey: ["managed-attraction-occurrence-seating", occurrenceId],
    queryFn: () => getManagedAttractionOccurrenceSeating(occurrenceId),
    enabled: Boolean(occurrenceId),
    refetchInterval: 20_000,
  });

  const actionMutation = useMutation({
    mutationFn: (action: SeatingInventoryAction) =>
      applyAttractionSeatingInventory(occurrenceId, {
        action,
        seatIds: selectedIds,
        note: note.trim() || undefined,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ["managed-attraction-occurrence-seating", occurrenceId],
        data,
      );
      setSelectedIds([]);
      setNote("");
      toast.success("Seat inventory updated");
    },
    onError: (e) => {
      const code = (e as { code?: string }).code;
      if (code === "SEAT_SOLD_ONLINE") {
        toast.error(
          e instanceof Error
            ? e.message
            : "Those seats were already sold online. Pick another available seat.",
        );
        setSelectedIds([]);
        void seatingQuery.refetch();
        return;
      }
      if (code === "SEAT_SOLD_OFFLINE") {
        toast.error(
          e instanceof Error
            ? e.message
            : "Release the local sale before blocking or unblocking.",
        );
        void seatingQuery.refetch();
        return;
      }
      toastApiError(e, "Could not update seats");
      void seatingQuery.refetch();
    },
  });

  const toggleSeat = (seat: ManagedInventorySeat) => {
    if (seat.status === "sold_online") return;
    setSelectedIds((prev) =>
      prev.includes(seat.id)
        ? prev.filter((id) => id !== seat.id)
        : [...prev, seat.id],
    );
  };

  const raw = seatingQuery.data;
  const layout: ManagedSeatingLayout | null = raw
    ? {
        eventId: raw.occurrenceId,
        eventName: [raw.attractionName, raw.slotName].filter(Boolean).join(" · "),
        seatingEnabled: raw.seatingEnabled,
        stats: raw.stats,
        sections: raw.sections.map((section) => ({
          ...section,
          seats: section.seats.map((seat) => ({
            ...seat,
            status: seat.status as ManagedInventorySeat["status"],
            offlineSold: seat.offlineSold ?? false,
            offlineSoldNote: seat.offlineSoldNote ?? null,
          })),
        })),
      }
    : null;

  const stats = layout?.stats;
  const selectedCount = selectedIds.length;
  const busy = actionMutation.isPending;
  const backHref = paths.manageAttractionOccurrences(attractionId);

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title="Local sales · seats"
          description={
            layout?.eventName
              ? `Mark walk-in / box-office sales for ${layout.eventName}`
              : "Mark local sales, block seats, or free them up for this show."
          }
          action={
            <Button asChild variant="outline">
              <Link href={backHref}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to schedule
              </Link>
            </Button>
          }
        />

        {seatingQuery.isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : seatingQuery.isError ? (
          <DashboardErrorAlert
            message="Could not load seat inventory."
            onRetry={() => void seatingQuery.refetch()}
          />
        ) : !layout?.seatingEnabled ? (
          <div className="rounded-xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              This show uses ticket quantity, not seats
            </p>
            <p className="mt-1">
              Record local sales from the schedule page for this show, or enable
              reserved seating on the attraction.
            </p>
            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href={backHref}>Back to schedule</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Available" value={stats?.available ?? 0} />
              <StatCard label="Sold online" value={stats?.soldOnline ?? 0} />
              <StatCard label="Sold locally" value={stats?.soldOffline ?? 0} />
              <StatCard label="Blocked" value={stats?.blocked ?? 0} />
              <StatCard label="Held" value={stats?.held ?? 0} />
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {selectedCount > 0
                    ? `${selectedCount} seat${selectedCount === 1 ? "" : "s"} selected`
                    : "Select seats on the map, then choose an action"}
                </p>
                {selectedCount > 0 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIds([])}
                    disabled={busy}
                  >
                    Clear selection
                  </Button>
                ) : null}
              </div>

              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note (e.g. box office, VIP hold)"
                disabled={busy}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={busy || selectedCount === 0}
                  onClick={() => actionMutation.mutate("mark_offline_sold")}
                >
                  <Store className="mr-2 h-4 w-4" />
                  Sold locally
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || selectedCount === 0}
                  onClick={() => actionMutation.mutate("release_offline")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Release local sale
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || selectedCount === 0}
                  onClick={() => actionMutation.mutate("block")}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Block
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy || selectedCount === 0}
                  onClick={() => actionMutation.mutate("unblock")}
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Unblock
                </Button>
              </div>
            </div>

            <InventorySeatMap
              layout={layout}
              selectedIds={selectedIds}
              onToggleSeat={toggleSeat}
              disabled={busy}
            />

            <p className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
              <Armchair className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Local sales reduce online availability for this show only. Online
                sold seats cannot be changed here.
              </span>
            </p>
          </div>
        )}
      </DashboardPanel>
    </DashboardPageShell>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
