"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type {
  InventorySeatStatus,
  ManagedInventorySeat,
  ManagedSeatingLayout,
} from "@/features/seating/api";
import { SeatIcon } from "@/components/seating/SeatIcon";

const STATUS_CLASS: Record<InventorySeatStatus, string> = {
  available:
    "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer",
  blocked: "text-zinc-500 hover:text-zinc-400 hover:bg-zinc-500/10 cursor-pointer",
  sold_online: "text-rose-500/70 cursor-not-allowed opacity-80",
  sold_offline: "text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 cursor-pointer",
  held: "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 cursor-pointer",
};

type InventorySeatMapProps = {
  layout: ManagedSeatingLayout;
  selectedIds: string[];
  onToggleSeat: (seat: ManagedInventorySeat) => void;
  disabled?: boolean;
};

export function InventorySeatMap({
  layout,
  selectedIds,
  onToggleSeat,
  disabled,
}: InventorySeatMapProps) {
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  if (!layout.seatingEnabled || layout.sections.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        This event has no seating layout yet. Enable reserved seating when editing the event.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-md rounded-lg bg-muted px-6 py-2 text-center text-xs font-semibold tracking-[0.2em] text-muted-foreground">
        STAGE
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
        <LegendSeat className="text-emerald-400" label="Available" />
        <LegendSeat className="text-zinc-500" label="Blocked" />
        <LegendSeat className="text-orange-400" label="Sold locally" />
        <LegendSeat className="text-rose-500/70" label="Sold online" />
        <LegendSeat className="text-amber-400" label="Held" />
      </div>

      {layout.sections.map((section) => {
        const maxRow = Math.max(0, ...section.seats.map((s) => s.rowIndex));
        const maxCol = Math.max(0, ...section.seats.map((s) => s.colIndex));
        const rows = Array.from({ length: maxRow + 1 }, (_, rowIndex) => {
          const rowSeats = section.seats.filter((s) => s.rowIndex === rowIndex);
          const rowLabel = rowSeats[0]?.rowLabel ?? String.fromCharCode(65 + rowIndex);
          return { rowIndex, rowLabel, seats: rowSeats };
        });

        return (
          <div key={section.id} className="space-y-3">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: section.color }}
              />
              <h4 className="text-sm font-semibold">{section.name}</h4>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-card/40 p-4">
              <div className="mx-auto w-max space-y-1.5">
                {rows.map((row) => (
                  <div key={row.rowIndex} className="flex items-center gap-2">
                    <span className="w-5 text-center text-[10px] font-medium text-muted-foreground">
                      {row.rowLabel}
                    </span>
                    <div
                      className="grid gap-1"
                      style={{
                        gridTemplateColumns: `repeat(${maxCol + 1}, minmax(0, 1fr))`,
                      }}
                    >
                      {Array.from({ length: maxCol + 1 }, (_, colIndex) => {
                        const seat = row.seats.find((s) => s.colIndex === colIndex);
                        if (!seat) return <span key={colIndex} className="h-10 w-9" />;

                        const isSelected = selectedSet.has(seat.id);
                        const locked = seat.status === "sold_online";
                        return (
                          <button
                            key={seat.id}
                            type="button"
                            title={`${seat.label} · ${seat.status.replace("_", " ")}`}
                            aria-label={`Seat ${seat.label}`}
                            disabled={disabled || locked}
                            aria-pressed={isSelected}
                            onClick={() => onToggleSeat(seat)}
                            className={cn(
                              "relative flex h-10 w-9 items-center justify-center rounded-md transition-all",
                              STATUS_CLASS[seat.status],
                              isSelected &&
                                "bg-primary/15 text-primary ring-2 ring-primary ring-offset-1 ring-offset-background scale-110",
                            )}
                          >
                            <SeatIcon className="h-9 w-8" />
                            <span
                              className="pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums leading-none text-white"
                              aria-hidden
                            >
                              {seat.seatNumber}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LegendSeat({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <SeatIcon className={cn("h-4 w-3.5", className)} />
      {label}
    </span>
  );
}
