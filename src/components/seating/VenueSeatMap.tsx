"use client";

import * as React from "react";
import { ArrowLeft, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  PublicSeat,
  PublicSeatSection,
  SeatMapFocalPoint,
  SeatStatus,
} from "@/features/seating/api";
import {
  computeBounds,
  gridDims,
  mergeBounds,
  placeSectionSeats,
  resolveFocalPoint,
  sectionLabelPoint,
  sectionOutlinePath,
  SEAT_PITCH,
  SEAT_RADIUS,
  type Bounds,
  type SeatPlacement,
} from "@/lib/seating/geometry";

const SEAT_FILL: Record<SeatStatus, { fill: string; stroke: string; text: string }> = {
  available: { fill: "rgba(16,185,129,0.18)", stroke: "#34d399", text: "#a7f3d0" },
  selected: { fill: "#ec4899", stroke: "#f9a8d4", text: "#ffffff" },
  held: { fill: "rgba(245,158,11,0.15)", stroke: "rgba(245,158,11,0.45)", text: "rgba(253,230,138,0.5)" },
  held_by_me: { fill: "rgba(56,189,248,0.25)", stroke: "#38bdf8", text: "#e0f2fe" },
  sold: { fill: "rgba(63,63,70,0.55)", stroke: "#3f3f46", text: "#71717a" },
  blocked: { fill: "transparent", stroke: "transparent", text: "transparent" },
};

type SectionRender = {
  section: PublicSeatSection;
  placements: Array<SeatPlacement<PublicSeat>>;
  outline: string;
  labelPoint: { x: number; y: number };
  bounds: Bounds;
  availableCount: number;
  totalCount: number;
};

type VenueSeatMapProps = {
  sections: PublicSeatSection[];
  focalPoint?: SeatMapFocalPoint | null;
  selectedIds: string[];
  onToggleSeat: (seat: PublicSeat, section: PublicSeatSection) => void;
  disabled?: boolean;
  className?: string;
};

function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export function VenueSeatMap({
  sections,
  focalPoint,
  selectedIds,
  onToggleSeat,
  disabled,
  className,
}: VenueSeatMapProps) {
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const focal = React.useMemo(() => resolveFocalPoint(focalPoint), [focalPoint]);

  const rendered = React.useMemo<SectionRender[]>(() => {
    return sections
      .filter((section) => section.seats.length > 0)
      .map((section) => {
        const placements = placeSectionSeats(section, section.seats);
        const { rows, cols } = gridDims(section.seats);
        const bounds = computeBounds(placements, SEAT_PITCH * 1.5);
        return {
          section,
          placements,
          outline: sectionOutlinePath(section, rows, cols),
          labelPoint: sectionLabelPoint(section, rows, cols),
          bounds,
          availableCount: section.seats.filter(
            (s) => s.status === "available" || s.status === "held_by_me",
          ).length,
          totalCount: section.seats.filter((s) => s.status !== "blocked").length,
        };
      });
  }, [sections]);

  const fullBounds = React.useMemo<Bounds>(() => {
    let bounds: Bounds | null = null;
    for (const r of rendered) {
      bounds = bounds ? mergeBounds(bounds, r.bounds) : r.bounds;
    }
    if (focal) {
      const focalBounds: Bounds = {
        minX: focal.x - focal.width / 2 - SEAT_PITCH,
        minY: focal.y - focal.height / 2 - SEAT_PITCH,
        width: focal.width + SEAT_PITCH * 2,
        height: focal.height + SEAT_PITCH * 2,
      };
      bounds = bounds ? mergeBounds(bounds, focalBounds) : focalBounds;
    }
    return bounds ?? { minX: -200, minY: -200, width: 400, height: 400 };
  }, [rendered, focal]);

  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [viewBox, setViewBox] = React.useState<Bounds>(fullBounds);

  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const dragRef = React.useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origin: Bounds;
    moved: boolean;
  } | null>(null);

  const sectionsKey = React.useMemo(
    () => rendered.map((r) => r.section.id).join("|"),
    [rendered],
  );

  // Reset the camera when the layout itself changes (not on every status refresh).
  React.useEffect(() => {
    setActiveId(null);
    setViewBox(fullBounds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionsKey]);

  const active = rendered.find((r) => r.section.id === activeId) ?? null;

  const clientToSvg = React.useCallback(
    (clientX: number, clientY: number, vb: Bounds) => {
      const svg = svgRef.current;
      if (!svg) return { x: vb.minX + vb.width / 2, y: vb.minY + vb.height / 2 };
      const rect = svg.getBoundingClientRect();
      const scale = Math.min(rect.width / vb.width, rect.height / vb.height);
      const offsetX = (rect.width - vb.width * scale) / 2;
      const offsetY = (rect.height - vb.height * scale) / 2;
      return {
        x: vb.minX + (clientX - rect.left - offsetX) / scale,
        y: vb.minY + (clientY - rect.top - offsetY) / scale,
      };
    },
    [],
  );

  const zoomAt = React.useCallback(
    (clientX: number, clientY: number, factor: number) => {
      setViewBox((vb) => {
        const minWidth = Math.max(fullBounds.width / 24, SEAT_PITCH * 4);
        const maxWidth = fullBounds.width * 2.5;
        const nextWidth = Math.min(maxWidth, Math.max(minWidth, vb.width * factor));
        const applied = nextWidth / vb.width;
        const point = clientToSvg(clientX, clientY, vb);
        return {
          minX: point.x - (point.x - vb.minX) * applied,
          minY: point.y - (point.y - vb.minY) * applied,
          width: vb.width * applied,
          height: vb.height * applied,
        };
      });
    },
    [clientToSvg, fullBounds],
  );

  React.useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 1.18 : 1 / 1.18);
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origin: viewBox,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - drag.startX;
    const dyPx = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dxPx, dyPx) < 5) return;
    drag.moved = true;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / drag.origin.width, rect.height / drag.origin.height);
    setViewBox({
      ...drag.origin,
      minX: drag.origin.minX - dxPx / scale,
      minY: drag.origin.minY - dyPx / scale,
    });
  };

  const onPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (drag?.pointerId === e.pointerId) {
      // Keep `moved` readable during the click that follows pointerup.
      window.setTimeout(() => {
        dragRef.current = null;
      }, 0);
    }
  };

  const wasDrag = () => Boolean(dragRef.current?.moved);

  const focusSection = (render: SectionRender) => {
    if (wasDrag()) return;
    setActiveId(render.section.id);
    setViewBox(render.bounds);
  };

  const backToOverview = () => {
    setActiveId(null);
    setViewBox(fullBounds);
  };

  if (rendered.length === 0) {
    return (
      <p className="rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-8 text-center text-sm text-zinc-400">
        No seating chart is available yet.
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          {active ? (
            <button
              type="button"
              onClick={backToOverview}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All sections
            </button>
          ) : (
            <span>Tap a section to pick seats. Scroll to zoom, drag to move.</span>
          )}
          {active ? (
            <span className="font-medium text-zinc-200">
              {active.section.name}
              <span className="ml-1.5 text-zinc-500">
                {active.section.ticketType.name} ·{" "}
                {formatPrice(active.section.ticketType.price, active.section.ticketType.currency)}
              </span>
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <LegendDot color="#34d399" label="Available" />
          <LegendDot color="#ec4899" label="Selected" />
          <LegendDot color="rgba(245,158,11,0.6)" label="Held" />
          <LegendDot color="#3f3f46" label="Sold" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950/70">
        <svg
          ref={svgRef}
          viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-[380px] w-full touch-none select-none sm:h-[460px]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          role="application"
          aria-label="Venue seat map"
        >
          {focal ? (
            <g aria-hidden>
              {focal.shape === "ellipse" ? (
                <ellipse
                  cx={focal.x}
                  cy={focal.y}
                  rx={focal.width / 2}
                  ry={focal.height / 2}
                  fill="rgba(63,63,70,0.35)"
                  stroke="#52525b"
                  strokeWidth={2}
                />
              ) : (
                <rect
                  x={focal.x - focal.width / 2}
                  y={focal.y - focal.height / 2}
                  width={focal.width}
                  height={focal.height}
                  rx={8}
                  fill="rgba(63,63,70,0.35)"
                  stroke="#52525b"
                  strokeWidth={2}
                />
              )}
              <text
                x={focal.x}
                y={focal.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#a1a1aa"
                fontSize={16}
                fontWeight={700}
                letterSpacing={4}
              >
                {focal.label}
              </text>
            </g>
          ) : null}

          {rendered.map((render) => {
            const isActive = render.section.id === activeId;
            const soldOut = render.availableCount === 0;

            if (active && !isActive) {
              return (
                <path
                  key={render.section.id}
                  d={render.outline}
                  fill={render.section.color}
                  fillOpacity={0.06}
                  stroke={render.section.color}
                  strokeOpacity={0.25}
                  strokeWidth={1.5}
                  className="cursor-pointer"
                  onClick={() => {
                    if (!wasDrag()) focusSection(render);
                  }}
                />
              );
            }

            if (!active) {
              return (
                <g
                  key={render.section.id}
                  className={cn(!soldOut && "cursor-pointer")}
                  onClick={() => {
                    if (!soldOut) focusSection(render);
                  }}
                >
                  <path
                    d={render.outline}
                    fill={render.section.color}
                    fillOpacity={soldOut ? 0.06 : 0.22}
                    stroke={render.section.color}
                    strokeOpacity={soldOut ? 0.3 : 0.8}
                    strokeWidth={2}
                    className={cn(!soldOut && "transition-opacity hover:opacity-80")}
                  >
                    <title>
                      {`${render.section.name} · ${render.section.ticketType.name} · ${
                        soldOut
                          ? "Sold out"
                          : `${render.availableCount} available from ${formatPrice(
                              render.section.ticketType.price,
                              render.section.ticketType.currency,
                            )}`
                      }`}
                    </title>
                  </path>
                  <text
                    x={render.labelPoint.x}
                    y={render.labelPoint.y - 7}
                    textAnchor="middle"
                    fill={soldOut ? "#52525b" : "#fafafa"}
                    fontSize={17}
                    fontWeight={700}
                    pointerEvents="none"
                  >
                    {render.section.name}
                  </text>
                  <text
                    x={render.labelPoint.x}
                    y={render.labelPoint.y + 12}
                    textAnchor="middle"
                    fill={soldOut ? "#52525b" : "#d4d4d8"}
                    fontSize={11}
                    pointerEvents="none"
                  >
                    {soldOut
                      ? "Sold out"
                      : `${formatPrice(
                          render.section.ticketType.price,
                          render.section.ticketType.currency,
                        )} · ${render.availableCount} left`}
                  </text>
                </g>
              );
            }

            return (
              <g key={render.section.id}>
                <path
                  d={render.outline}
                  fill={render.section.color}
                  fillOpacity={0.05}
                  stroke={render.section.color}
                  strokeOpacity={0.5}
                  strokeWidth={1.5}
                />
                {render.placements.map(({ seat, x, y }) => {
                  const isSelected = selectedSet.has(seat.id);
                  const status: SeatStatus = isSelected ? "selected" : seat.status;
                  if (status === "blocked") return null;
                  const palette = SEAT_FILL[status];
                  const clickable =
                    !disabled &&
                    (status === "available" ||
                      status === "selected" ||
                      status === "held_by_me");
                  return (
                    <g
                      key={seat.id}
                      className={cn(clickable ? "cursor-pointer" : "cursor-not-allowed")}
                      onClick={() => {
                        if (!clickable || wasDrag()) return;
                        onToggleSeat(seat, render.section);
                      }}
                      role="button"
                      aria-label={`Seat ${seat.label}, ${status}`}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={SEAT_RADIUS}
                        fill={palette.fill}
                        stroke={palette.stroke}
                        strokeWidth={isSelected ? 2 : 1.25}
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize={7.5}
                        fontWeight={700}
                        fill={palette.text}
                        pointerEvents="none"
                      >
                        {seat.seatNumber}
                      </text>
                      <title>{`${render.section.name} · Row ${seat.rowLabel} · Seat ${seat.seatNumber}`}</title>
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5">
          <ZoomButton
            label="Zoom in"
            onClick={() => {
              const svg = svgRef.current;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 / 1.35);
            }}
          >
            <Plus className="h-4 w-4" />
          </ZoomButton>
          <ZoomButton
            label="Zoom out"
            onClick={() => {
              const svg = svgRef.current;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1.35);
            }}
          >
            <Minus className="h-4 w-4" />
          </ZoomButton>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      {label}
    </span>
  );
}

function ZoomButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900/90 text-zinc-200 shadow transition hover:bg-zinc-700"
    >
      {children}
    </button>
  );
}
