"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Minus, Plus, Ticket } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DashboardPageShell,
  DashboardPanel,
  DashboardErrorAlert,
} from "@/components/dashboard/dashboard-ui";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-shared";
import {
  getManagedEvent,
  updateTicketQuantities,
  type TicketTypeRow,
} from "@/features/events/api";
import { useDashboardPaths } from "@/features/dashboard/paths";
import { toastApiError } from "@/lib/toasts";

type DraftQty = Record<string, number>;

function draftsFromTickets(tickets: TicketTypeRow[]): DraftQty {
  const next: DraftQty = {};
  for (const tt of tickets) {
    if (tt.id) next[tt.id] = tt.quantityTotal;
  }
  return next;
}

export function ManageTicketQuantityContent() {
  const params = useParams<{ id: string }>();
  const eventId = params.id;
  const paths = useDashboardPaths();
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = React.useState<DraftQty>({});

  const eventQuery = useQuery({
    queryKey: ["managed-event-quantity", eventId],
    queryFn: () => getManagedEvent(eventId),
    enabled: Boolean(eventId),
  });

  React.useEffect(() => {
    if (eventQuery.data?.ticketTypes) {
      setDrafts(draftsFromTickets(eventQuery.data.ticketTypes));
    }
  }, [eventQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const tickets = eventQuery.data?.ticketTypes ?? [];
      const updates = tickets
        .filter((tt): tt is TicketTypeRow & { id: string } => Boolean(tt.id))
        .map((tt) => ({
          ticketTypeId: tt.id,
          quantityTotal: drafts[tt.id] ?? tt.quantityTotal,
        }))
        .filter((u) => {
          const original = tickets.find((t) => t.id === u.ticketTypeId);
          return original && original.quantityTotal !== u.quantityTotal;
        });
      if (updates.length === 0) {
        throw new Error("NO_CHANGES");
      }
      return updateTicketQuantities(eventId, updates);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["managed-event-quantity", eventId], data);
      setDrafts(draftsFromTickets(data.ticketTypes));
      queryClient.invalidateQueries({ queryKey: ["managed-events"] });
      toast.success("Ticket quantities updated");
    },
    onError: (e) => {
      if (e instanceof Error && e.message === "NO_CHANGES") {
        toast.message("No quantity changes to save");
        return;
      }
      toastApiError(e, "Could not update ticket quantities");
      void eventQuery.refetch();
    },
  });

  const event = eventQuery.data;
  const tickets = event?.ticketTypes ?? [];
  const busy = saveMutation.isPending;

  const setQty = (ticketId: string, value: number, minSold: number) => {
    const next = Math.max(minSold, Math.floor(value) || minSold);
    setDrafts((prev) => ({ ...prev, [ticketId]: next }));
  };

  const hasChanges = tickets.some(
    (tt) => tt.id && drafts[tt.id] != null && drafts[tt.id] !== tt.quantityTotal,
  );

  return (
    <DashboardPageShell>
      <DashboardPanel>
        <DashboardPageHeader
          title="Manage ticket quantity"
          description={
            event?.eventName
              ? `Adjust capacity for ${event.eventName}`
              : "Increase or decrease how many tickets can be sold"
          }
          action={
            <Button variant="outline" asChild>
              <Link href={paths.events}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to events
              </Link>
            </Button>
          }
        />

        {eventQuery.isError ? (
          <DashboardErrorAlert
            message={
              eventQuery.error instanceof Error
                ? eventQuery.error.message
                : "Could not load event"
            }
            onRetry={() => void eventQuery.refetch()}
            retryLabel="Retry"
          />
        ) : eventQuery.isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading ticket types…
          </div>
        ) : event?.seatingEnabled ? (
          <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
            <p className="font-medium">This event uses reserved seating.</p>
            <p className="mt-1 text-muted-foreground">
              Capacity comes from the seat map. Manage seats instead of ticket
              quantity.
            </p>
            <Button className="mt-3" asChild>
              <Link href={paths.manageEventSeating(eventId)}>Open seat map</Link>
            </Button>
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ticket types on this event yet. Edit the event to add tickets.
          </p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Total cannot go below tickets already sold. Remaining = total − sold.
            </p>

            <ul className="divide-y divide-border/60 rounded-lg border border-border/60">
              {tickets.map((tt) => {
                if (!tt.id) return null;
                const sold = tt.quantitySold ?? 0;
                const total = drafts[tt.id] ?? tt.quantityTotal;
                const remaining = Math.max(0, total - sold);
                return (
                  <li
                    key={tt.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-medium">
                        <Ticket className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{tt.name}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Sold {sold} · Remaining {remaining}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={busy || total <= sold}
                        aria-label={`Decrease ${tt.name}`}
                        onClick={() => setQty(tt.id!, total - 1, sold)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={sold}
                        step={1}
                        className="w-24 text-center"
                        value={total}
                        disabled={busy}
                        onChange={(e) =>
                          setQty(tt.id!, Number(e.target.value), sold)
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        disabled={busy}
                        aria-label={`Increase ${tt.name}`}
                        onClick={() => setQty(tt.id!, total + 1, sold)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="flex justify-end">
              <Button
                type="button"
                disabled={busy || !hasChanges}
                onClick={() => saveMutation.mutate()}
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save quantities"
                )}
              </Button>
            </div>
          </div>
        )}
      </DashboardPanel>
    </DashboardPageShell>
  );
}
