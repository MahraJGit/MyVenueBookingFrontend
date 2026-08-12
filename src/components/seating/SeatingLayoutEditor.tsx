"use client";

import * as React from "react";
import { Armchair, LandPlot, Plus, RectangleHorizontal, Theater, Trash2, Volleyball } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SeatMapPreview } from "@/components/seating/SeatMap";
import type { SeatingSectionInput, SeatMapFocalPoint } from "@/features/seating/api";
import {
  computeBounds,
  generatePreviewSeats,
  gridDims,
  hasCustomGeometry,
  mergeBounds,
  placeSectionSeats,
  resolveFocalPoint,
  resolveGeometry,
  sectionLabelPoint,
  sectionOutlinePath,
  SEAT_PITCH,
  SEAT_RADIUS,
  type Bounds,
} from "@/lib/seating/geometry";
import {
  buildSeatingPreset,
  SEATING_PRESETS,
  type SeatingPresetId,
} from "@/lib/seating/presets";
import { cn } from "@/lib/utils";

const SECTION_COLORS = [
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
];

const PRESET_ICONS: Record<SeatingPresetId, React.ComponentType<{ className?: string }>> = {
  classic: RectangleHorizontal,
  theater: Theater,
  stadium: LandPlot,
  arena: Volleyball,
};

export type SeatingEditorSection = SeatingSectionInput;

type TicketOption = {
  id: string;
  name: string;
};

type SeatingLayoutEditorProps = {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  sections: SeatingEditorSection[];
  onSectionsChange: (sections: SeatingEditorSection[]) => void;
  focalPoint: SeatMapFocalPoint | null;
  onFocalPointChange: (focal: SeatMapFocalPoint | null) => void;
  ticketOptions: TicketOption[];
  disabled?: boolean;
  /** When false, only the layout controls render (toggle lives outside). */
  showEnableToggle?: boolean;
};

function emptySection(
  ticketTypeId: string,
  index: number,
  offsetY = 0,
): SeatingEditorSection {
  return {
    ticketTypeId,
    name: index === 0 ? "Main Floor" : `Section ${index + 1}`,
    color: SECTION_COLORS[index % SECTION_COLORS.length],
    sortOrder: index,
    rowCount: 5,
    seatsPerRow: 8,
    rowLabelStart: "A",
    shape: "GRID",
    posX: 0,
    posY: offsetY,
    rotation: 0,
    curve: 0,
    arcRadius: 0,
  };
}

export function SeatingLayoutEditor({
  enabled,
  onEnabledChange,
  sections,
  onSectionsChange,
  focalPoint,
  onFocalPointChange,
  ticketOptions,
  disabled,
  showEnableToggle = true,
}: SeatingLayoutEditorProps) {
  const defaultTicketId = ticketOptions[0]?.id ?? "";
  const [selectedIndex, setSelectedIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!enabled || sections.length > 0 || !defaultTicketId) return;
    onSectionsChange([emptySection(defaultTicketId, 0)]);
  }, [enabled, sections.length, defaultTicketId, onSectionsChange]);

  const totalSeats = sections.reduce(
    (sum, s) => sum + Math.max(0, s.rowCount) * Math.max(0, s.seatsPerRow),
    0,
  );

  const customGeometry = hasCustomGeometry(sections, focalPoint);
  const hasTickets = ticketOptions.length > 0;

  const updateSection = (index: number, patch: Partial<SeatingEditorSection>) => {
    onSectionsChange(
      sections.map((section, i) => (i === index ? { ...section, ...patch } : section)),
    );
  };

  const applyPreset = (preset: SeatingPresetId) => {
    const ticketIds = ticketOptions.map((t) => t.id);
    if (ticketIds.length === 0) return;
    const built = buildSeatingPreset(preset, ticketIds);
    onSectionsChange(built.sections);
    onFocalPointChange(built.focalPoint);
    setSelectedIndex(null);
  };

  const addSection = () => {
    // Offset new sections downward on the venue map so they don't stack at the origin.
    const maxY = sections.reduce((max, s) => {
      const g = resolveGeometry(s);
      return Math.max(max, g.posY);
    }, 0);
    onSectionsChange([
      ...sections,
      emptySection(
        defaultTicketId,
        sections.length,
        customGeometry ? maxY + SEAT_PITCH * 9 : 0,
      ),
    ]);
  };

  const venuePreview = customGeometry ? (
    <EditorVenuePreview
      sections={sections}
      focalPoint={focalPoint}
      selectedIndex={selectedIndex}
      onSelect={setSelectedIndex}
      onMoveSection={(index, x, y) =>
        updateSection(index, { posX: Math.round(x), posY: Math.round(y) })
      }
      disabled={disabled}
    />
  ) : (
    <div className="venue-preview-root flex h-full flex-col space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
      <p className="shrink-0 text-xs text-muted-foreground">
        Venue preview — pick a layout preset or set a focal point to arrange sections on a map.
      </p>
      <div className="min-h-[240px] flex-1">
        <SeatMapPreview sections={sections} />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {showEnableToggle ? (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card/40 p-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Armchair className="h-4 w-4 text-primary" />
              Reserved seating
            </div>
            <p className="text-sm text-muted-foreground">
              Let buyers pick seats on a map. Ticket quantities are set from your
              layout.
            </p>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onEnabledChange}
            disabled={disabled}
            aria-label="Enable reserved seating"
          />
        </div>
      ) : null}

      {enabled ? (
        !hasTickets ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Add at least one ticket type above, then come back here to design sections
            and see the venue layout.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Start from a venue layout</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {SEATING_PRESETS.map((preset) => {
                  const Icon = PRESET_ICONS[preset.id];
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => applyPreset(preset.id)}
                      className="rounded-xl border border-border bg-card/40 p-3 text-left transition hover:border-primary/60 hover:bg-card disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-4 w-4 text-primary" />
                        {preset.name}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Picking a layout replaces the current sections. You can rename, recolor,
                move, and reshape every section afterwards.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Focal point</Label>
                <Select
                  value={focalPoint?.kind ?? "none"}
                  disabled={disabled}
                  onValueChange={(value) => {
                    if (value === "none") {
                      onFocalPointChange(null);
                      return;
                    }
                    onFocalPointChange({
                      kind: value as Exclude<SeatMapFocalPoint["kind"], "none">,
                      x: focalPoint?.x ?? 0,
                      y: focalPoint?.y ?? 0,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="stage">Stage</SelectItem>
                    <SelectItem value="field">Field</SelectItem>
                    <SelectItem value="court">Court</SelectItem>
                    <SelectItem value="screen">Screen</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Shown at the center of the map so buyers can orient themselves.
                </p>
              </div>
            </div>

            {/* Sections scroll in-card; preview stays pinned (page sticky fails under dashboard overflow). */}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-stretch lg:h-[min(72vh,680px)]">
              <div className="order-2 flex min-h-0 flex-col gap-3 lg:order-1">
                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 max-h-[min(55vh,480px)] lg:max-h-none">
                {sections.map((section, index) => {
                  const geom = resolveGeometry(section);
                  const seatCount =
                    Math.max(0, section.rowCount) * Math.max(0, section.seatsPerRow);
                  return (
                    <div
                      key={index}
                      className={cn(
                        "space-y-3 rounded-xl border border-border p-4 transition",
                        selectedIndex === index && "border-primary/70 ring-1 ring-primary/40",
                      )}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate">
                            {section.name.trim() || `Section ${index + 1}`}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {seatCount} seats
                            {section.ticketTypeId
                              ? ` · ${
                                  ticketOptions.find((t) => t.id === section.ticketTypeId)
                                    ?.name ?? "Ticket"
                                }`
                              : null}
                          </p>
                        </div>
                        {sections.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive"
                            disabled={disabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedIndex(null);
                              onSectionsChange(sections.filter((_, i) => i !== index));
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Section name</Label>
                          <Input
                            value={section.name}
                            disabled={disabled}
                            onChange={(e) => updateSection(index, { name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ticket type</Label>
                          <Select
                            value={section.ticketTypeId}
                            disabled={disabled}
                            onValueChange={(value) =>
                              updateSection(index, { ticketTypeId: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select ticket type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ticketOptions.map((ticket) => (
                                <SelectItem key={ticket.id} value={ticket.id}>
                                  {ticket.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Rows</Label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={section.rowCount}
                            disabled={disabled}
                            onChange={(e) =>
                              updateSection(index, {
                                rowCount: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Seats per row</Label>
                          <Input
                            type="number"
                            min={1}
                            max={50}
                            value={section.seatsPerRow}
                            disabled={disabled}
                            onChange={(e) =>
                              updateSection(index, {
                                seatsPerRow: Math.max(1, Number(e.target.value) || 1),
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>First row letter</Label>
                          <Input
                            maxLength={1}
                            value={section.rowLabelStart ?? "A"}
                            disabled={disabled}
                            onChange={(e) => {
                              const letter = e.target.value.replace(/[^a-zA-Z]/g, "").slice(0, 1);
                              updateSection(index, {
                                rowLabelStart: (letter || "A").toUpperCase(),
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Color</Label>
                          <div className="flex flex-wrap gap-2">
                            {SECTION_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                disabled={disabled}
                                onClick={() => updateSection(index, { color })}
                                className="h-8 w-8 rounded-full border-2 transition"
                                style={{
                                  backgroundColor: color,
                                  borderColor:
                                    section.color === color ? "white" : "transparent",
                                  outline:
                                    section.color === color
                                      ? `2px solid ${color}`
                                      : undefined,
                                }}
                                aria-label={`Color ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Row shape</Label>
                          <Select
                            value={geom.shape}
                            disabled={disabled}
                            onValueChange={(value) => {
                              if (value === "ARC") {
                                updateSection(index, {
                                  shape: "ARC",
                                  curve: geom.curve >= 1 ? geom.curve : 40,
                                });
                              } else {
                                updateSection(index, { shape: "GRID" });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GRID">Straight rows</SelectItem>
                              <SelectItem value="ARC">Curved rows</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Angle (degrees)</Label>
                          <Input
                            type="number"
                            min={-360}
                            max={360}
                            value={geom.rotation}
                            disabled={disabled}
                            onChange={(e) =>
                              updateSection(index, {
                                rotation: Math.max(
                                  -360,
                                  Math.min(360, Number(e.target.value) || 0),
                                ),
                              })
                            }
                          />
                        </div>
                        {geom.shape === "ARC" ? (
                          <>
                            <div className="space-y-2">
                              <Label>Curve (degrees)</Label>
                              <Input
                                type="number"
                                min={1}
                                max={300}
                                value={section.curve ?? 40}
                                disabled={disabled}
                                onChange={(e) =>
                                  updateSection(index, {
                                    curve: Math.max(
                                      1,
                                      Math.min(300, Number(e.target.value) || 1),
                                    ),
                                  })
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Distance from focal point</Label>
                              <Input
                                type="number"
                                min={0}
                                max={5000}
                                value={section.arcRadius ?? 0}
                                disabled={disabled}
                                onChange={(e) =>
                                  updateSection(index, {
                                    arcRadius: Math.max(0, Number(e.target.value) || 0),
                                  })
                                }
                              />
                              <p className="text-xs text-muted-foreground">0 = automatic</p>
                            </div>
                          </>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                </div>

                <div className="shrink-0 space-y-3 border-t border-border pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={disabled || !defaultTicketId}
                    onClick={addSection}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add section
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Total seats:{" "}
                    <span className="font-medium text-foreground">{totalSeats}</span>
                  </p>
                </div>
              </div>

              <div className="order-1 flex min-h-0 flex-col lg:order-2">
                <div className="min-h-0 flex-1">{venuePreview}</div>
              </div>
            </div>
          </div>
        )
      ) : null}
    </div>
  );
}

type EditorVenuePreviewProps = {
  sections: SeatingEditorSection[];
  focalPoint: SeatMapFocalPoint | null;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onMoveSection: (index: number, posX: number, posY: number) => void;
  disabled?: boolean;
};

function EditorVenuePreview({
  sections,
  focalPoint,
  selectedIndex,
  onSelect,
  onMoveSection,
  disabled,
}: EditorVenuePreviewProps) {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const dragRef = React.useRef<{
    index: number;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const focal = React.useMemo(() => resolveFocalPoint(focalPoint), [focalPoint]);

  const rendered = React.useMemo(() => {
    return sections.map((section) => {
      const seats = generatePreviewSeats(section.rowCount, section.seatsPerRow);
      const placements = placeSectionSeats(section, seats);
      const { rows, cols } = gridDims(seats);
      return {
        section,
        placements,
        outline: sectionOutlinePath(section, rows, cols),
        labelPoint: sectionLabelPoint(section, rows, cols),
        bounds: computeBounds(placements, SEAT_PITCH * 1.5),
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

  // Freeze the camera while dragging so the map doesn't refit mid-drag.
  const [viewBox, setViewBox] = React.useState<Bounds>(fullBounds);
  React.useEffect(() => {
    if (!dragging) setViewBox(fullBounds);
  }, [fullBounds, dragging]);

  const startDrag = (index: number) => (e: React.PointerEvent<SVGGElement>) => {
    if (disabled || e.button !== 0) return;
    const geom = resolveGeometry(sections[index]);
    dragRef.current = {
      index,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      originX: geom.posX,
      originY: geom.posY,
      moved: false,
    };
    setDragging(true);
    svgRef.current?.setPointerCapture(e.pointerId);
    e.stopPropagation();
  };

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    const svg = svgRef.current;
    if (!drag || !svg || drag.pointerId !== e.pointerId) return;
    const dxPx = e.clientX - drag.startClientX;
    const dyPx = e.clientY - drag.startClientY;
    if (!drag.moved && Math.hypot(dxPx, dyPx) < 4) return;
    drag.moved = true;
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
    onMoveSection(drag.index, drag.originX + dxPx / scale, drag.originY + dyPx / scale);
  };

  const endDrag = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (!drag.moved) onSelect(drag.index);
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div className="venue-preview-root flex h-full flex-col space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
      <div className="flex shrink-0 items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Venue preview — drag a section to reposition it, click to select.
        </p>
        <span className="shrink-0 text-xs font-medium text-foreground">
          {sections.length} section{sections.length === 1 ? "" : "s"}
        </span>
      </div>
      <svg
        ref={svgRef}
        viewBox={`${viewBox.minX} ${viewBox.minY} ${viewBox.width} ${viewBox.height}`}
        preserveAspectRatio="xMidYMid meet"
        className="min-h-[240px] w-full flex-1 touch-none select-none rounded-xl bg-background/60 lg:min-h-0"
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {focal ? (
          <g aria-hidden>
            {focal.shape === "ellipse" ? (
              <ellipse
                cx={focal.x}
                cy={focal.y}
                rx={focal.width / 2}
                ry={focal.height / 2}
                fill="currentColor"
                className="text-muted-foreground/20"
                stroke="currentColor"
                strokeWidth={2}
              />
            ) : (
              <rect
                x={focal.x - focal.width / 2}
                y={focal.y - focal.height / 2}
                width={focal.width}
                height={focal.height}
                rx={8}
                fill="currentColor"
                className="text-muted-foreground/20"
                stroke="currentColor"
                strokeWidth={2}
              />
            )}
            <text
              x={focal.x}
              y={focal.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontWeight={700}
              letterSpacing={4}
              fill="currentColor"
              className="text-muted-foreground"
            >
              {focal.label}
            </text>
          </g>
        ) : null}

        {rendered.map((render, index) => (
          <g
            key={index}
            className={cn(!disabled && "cursor-grab")}
            onPointerDown={startDrag(index)}
          >
            <path
              d={render.outline}
              fill={render.section.color}
              fillOpacity={0.14}
              stroke={selectedIndex === index ? "#ffffff" : render.section.color}
              strokeOpacity={selectedIndex === index ? 0.9 : 0.7}
              strokeWidth={selectedIndex === index ? 3 : 2}
            />
            {render.placements.map(({ x, y }, seatIdx) => (
              <circle
                key={seatIdx}
                cx={x}
                cy={y}
                r={SEAT_RADIUS * 0.75}
                fill={render.section.color}
                fillOpacity={0.75}
                pointerEvents="none"
              />
            ))}
            <text
              x={render.labelPoint.x}
              y={render.labelPoint.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={15}
              fontWeight={700}
              fill="#ffffff"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={0.6}
              pointerEvents="none"
            >
              {render.section.name.trim() || `Section ${index + 1}`}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
