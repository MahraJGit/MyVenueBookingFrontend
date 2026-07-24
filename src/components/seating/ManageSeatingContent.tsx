"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Armchair, ArrowLeft, Ban, CheckCircle2, Loader2, Store, Unlock } from "lucide-react";
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
  applySeatingInventory,
  getManagedSeating,
  type ManagedInventorySeat,
  type SeatingInventoryAction,
} from "@/features/seating/api";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { toastApiError } from "@/lib/toasts";

export function ManageSeatingContent() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const paths = useDashboardPaths();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [note, setNote] = React.useState("");

  const seatingQuery = useQuery({
    queryKey: ["managed-seating-inventory", eventId],
    queryFn: () => getManagedSeating(eventId),
    enabled: Boolean(eventId),
    refetchInterval: 20_000,
  });

  const actionMutation = useMutation({
    mutationFn: (action: SeatingInventoryAction) =>
      applySeatingInventory(eventId, {
        action,
        seatIds: selectedIds,
        note: note.trim() || undefined,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(["managed-seating-inventory", eventId], data);
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
            : "Those seats were already sold online. Pick another available seat for the local sale.",
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
      prev.includes(seat.id) ? prev.filter((id) => id !== seat.id) : [...prev, seat.id],
    );
  };

  const layout = seatingQuery.data;
  const stats = layout?.stats;
  const selectedCount = selectedIds.length;
  const busy = actionMutation.isPending;

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title="Manage seating"
          description={
            layout?.eventName
              ? `Live seat inventory for ${layout.eventName}`
              : "Mark local sales, block seats, or free them up without editing the event."
          }
          action={
            <Button asChild variant="outline">
              <Link href={paths.events}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to events
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
            message="Could not load seating inventory."
            onRetry={() => void seatingQuery.refetch()}
          />
        ) : !layout?.seatingEnabled ? (
          <div className="rounded-xl border border-border bg-muted/20 p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">This event uses ticket quantity, not seats</p>
            <p className="mt-1">
              Manage how many tickets can be sold from the quantity screen, or enable
              reserved seating when editing the event.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="default">
                <Link href={paths.manageEventQuantity(eventId)}>Manage quantity</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={paths.editEvent(eventId)}>Edit event</Link>
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

            <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
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

            <p className="text-xs text-muted-foreground inline-flex items-start gap-1.5">
              <Armchair className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                If a seat was already sold online, pick another available seat for the
                local buyer. Online checkouts that lose a race are auto-refunded.
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
