"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type {
  PublicSeat,
  PublicSeatSection,
  SeatMapFocalPoint,
  SeatStatus,
} from "@/features/seating/api";
import { SeatIcon } from "@/components/seating/SeatIcon";
import { VenueSeatMap } from "@/components/seating/VenueSeatMap";
import { hasCustomGeometry } from "@/lib/seating/geometry";

const STATUS_CLASS: Record<SeatStatus, string> = {
  available:
    "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer",
  selected:
    "text-pink-400 bg-pink-500/15 ring-2 ring-pink-400/50 cursor-pointer scale-110",
  held: "text-amber-500/50 cursor-not-allowed",
  held_by_me: "text-sky-400 bg-sky-500/10 cursor-pointer ring-1 ring-sky-400/40",
  sold: "text-zinc-600 cursor-not-allowed opacity-60",
  blocked: "opacity-0 pointer-events-none cursor-default",
};

type SeatMapProps = {
  sections: PublicSeatSection[];
  focalPoint?: SeatMapFocalPoint | null;
  selectedIds: string[];
  onToggleSeat: (seat: PublicSeat, section: PublicSeatSection) => void;
  disabled?: boolean;
  className?: string;
};

export function SeatMap({
  sections,
  focalPoint,
  selectedIds,
  onToggleSeat,
  disabled,
  className,
}: SeatMapProps) {
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const isVenueShaped = React.useMemo(
    () => hasCustomGeometry(sections, focalPoint),
    [sections, focalPoint],
  );

  if (isVenueShaped) {
    return (
      <VenueSeatMap
        sections={sections}
        focalPoint={focalPoint}
        selectedIds={selectedIds}
        onToggleSeat={onToggleSeat}
        disabled={disabled}
        className={className}
      />
    );
  }

  if (sections.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-8 text-center text-sm text-zinc-400">
        No seating chart is available for this event yet.
      </p>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="mx-auto max-w-md rounded-lg bg-gradient-to-b from-zinc-600 to-zinc-800 px-6 py-2 text-center text-xs font-semibold tracking-[0.2em] text-zinc-200 shadow-inner">
        STAGE
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
        <LegendSeat className="text-emerald-400" label="Available" />
        <LegendSeat className="text-pink-400" label="Selected" />
        <LegendSeat className="text-amber-500/50" label="Held" />
        <LegendSeat className="text-zinc-600" label="Sold" />
      </div>

      <div className="space-y-8">
        {sections.map((section) => {
          const maxRow = Math.max(0, ...section.seats.map((s) => s.rowIndex));
          const maxCol = Math.max(0, ...section.seats.map((s) => s.colIndex));
          const rows = Array.from({ length: maxRow + 1 }, (_, rowIndex) => {
            const rowSeats = section.seats.filter((s) => s.rowIndex === rowIndex);
            const rowLabel = rowSeats[0]?.rowLabel ?? String.fromCharCode(65 + rowIndex);
            return { rowIndex, rowLabel, seats: rowSeats };
          });

          return (
            <div key={section.id} className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: section.color }}
                    aria-hidden
                  />
                  <h4 className="text-sm font-semibold text-white">{section.name}</h4>
                  <span className="text-xs text-zinc-500">
                    {section.ticketType.name}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="mx-auto w-max space-y-1.5">
                  {rows.map((row) => (
                    <div key={row.rowIndex} className="flex items-center gap-2">
                      <span className="w-5 text-center text-[10px] font-medium text-zinc-500">
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
                          if (!seat) {
                            return <span key={colIndex} className="h-10 w-9" />;
                          }

                          const isSelected = selectedSet.has(seat.id);
                          const status: SeatStatus = isSelected
                            ? "selected"
                            : seat.status === "held_by_me" && isSelected
                              ? "selected"
                              : seat.status;

                          const clickable =
                            !disabled &&
                            (status === "available" ||
                              status === "selected" ||
                              status === "held_by_me");

                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={!clickable}
                              title={seat.label}
                              aria-label={`Seat ${seat.label}`}
                              aria-pressed={isSelected}
                              onClick={() => onToggleSeat(seat, section)}
                              className={cn(
                                "relative flex h-10 w-9 items-center justify-center rounded-md transition-all",
                                STATUS_CLASS[status],
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

/** Compact preview for admin editor (all seats available-looking). */
export function SeatMapPreview({
  sections,
}: {
  sections: Array<{
    name: string;
    color: string;
    rowCount: number;
    seatsPerRow: number;
    rowLabelStart?: string;
  }>;
}) {
  if (sections.length === 0) return null;

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="mx-auto max-w-xs rounded-md bg-muted px-4 py-1.5 text-center text-[10px] font-semibold tracking-widest text-muted-foreground">
        STAGE
      </div>
      {sections.map((section, idx) => {
        const start = (section.rowLabelStart ?? "A").toUpperCase().charCodeAt(0);
        return (
          <div key={`${section.name}-${idx}`} className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: section.color }}
              />
              {section.name}
              <span className="text-xs text-muted-foreground">
                {section.rowCount * section.seatsPerRow} seats
              </span>
            </div>
            <div className="space-y-1 overflow-x-auto">
              {Array.from({ length: section.rowCount }, (_, r) => {
                const rowLabel = String.fromCharCode(start + r);
                return (
                  <div key={r} className="flex items-center gap-1.5">
                    <span className="w-4 text-[10px] text-muted-foreground">{rowLabel}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: section.seatsPerRow }, (_, c) => (
                        <span
                          key={c}
                          title={`${rowLabel}${c + 1}`}
                          className="relative flex h-8 w-7 items-center justify-center"
                          style={{ color: section.color }}
                        >
                          <SeatIcon className="h-7 w-6" />
                          <span
                            className="pointer-events-none absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 text-[8px] font-bold tabular-nums leading-none text-white"
                            aria-hidden
                          >
                            {c + 1}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
