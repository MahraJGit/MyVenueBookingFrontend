import type {
  SeatMapFocalPoint,
  SectionGeometry,
  SectionShape,
} from "@/features/seating/api";

/** Canvas units between adjacent seat centers. */
export const SEAT_PITCH = 26;
/** Radius of a rendered seat circle in canvas units. */
export const SEAT_RADIUS = 9;

const DEG = Math.PI / 180;

export type ResolvedGeometry = {
  shape: SectionShape;
  posX: number;
  posY: number;
  rotation: number;
  curve: number;
  arcRadius: number;
};

export function resolveGeometry(g: SectionGeometry | undefined | null): ResolvedGeometry {
  const shape = g?.shape === "ARC" && (g?.curve ?? 0) >= 1 ? "ARC" : "GRID";
  return {
    shape,
    posX: g?.posX ?? 0,
    posY: g?.posY ?? 0,
    rotation: g?.rotation ?? 0,
    curve: g?.curve ?? 0,
    arcRadius: g?.arcRadius ?? 0,
  };
}

/** True when any section uses venue-map placement (curved rows, positions, rotation). */
export function hasCustomGeometry(
  sections: Array<SectionGeometry | undefined>,
  focalPoint?: SeatMapFocalPoint | null,
): boolean {
  if (focalPoint && focalPoint.kind !== "none") return true;
  return sections.some((g) => {
    if (!g) return false;
    const r = resolveGeometry(g);
    return r.shape !== "GRID" || r.posX !== 0 || r.posY !== 0 || r.rotation !== 0;
  });
}

export function gridDims(seats: Array<{ rowIndex: number; colIndex: number }>): {
  rows: number;
  cols: number;
} {
  let rows = 0;
  let cols = 0;
  for (const s of seats) {
    if (s.rowIndex + 1 > rows) rows = s.rowIndex + 1;
    if (s.colIndex + 1 > cols) cols = s.colIndex + 1;
  }
  return { rows: Math.max(1, rows), cols: Math.max(1, cols) };
}

/** Radius that spaces `cols` seats one pitch apart along a `sweepDeg` arc. */
export function autoArcRadius(cols: number, sweepDeg: number): number {
  const sweepRad = Math.max(sweepDeg, 4) * DEG;
  return Math.max(3 * SEAT_PITCH, (SEAT_PITCH * Math.max(1, cols - 1)) / sweepRad);
}

function firstRowRadius(geom: ResolvedGeometry, cols: number): number {
  return geom.arcRadius > 0 ? geom.arcRadius : autoArcRadius(cols, geom.curve);
}

/** Point at radius/angle from a curvature center. Angle 0 = up (screen), clockwise. */
function polar(cx: number, cy: number, r: number, angleDeg: number): { x: number; y: number } {
  const a = angleDeg * DEG;
  return { x: cx + r * Math.sin(a), y: cy - r * Math.cos(a) };
}

export type SeatPlacement<T> = { seat: T; x: number; y: number };

/** Compute canvas positions for every seat of a section from its geometry. */
export function placeSectionSeats<T extends { rowIndex: number; colIndex: number }>(
  geometry: SectionGeometry | undefined | null,
  seats: T[],
): Array<SeatPlacement<T>> {
  const geom = resolveGeometry(geometry);
  const { rows, cols } = gridDims(seats);

  if (geom.shape === "ARC") {
    const r0 = firstRowRadius(geom, cols);
    return seats.map((seat) => {
      const t = cols > 1 ? seat.colIndex / (cols - 1) - 0.5 : 0;
      const angle = geom.rotation + geom.curve * t;
      const radius = r0 + seat.rowIndex * SEAT_PITCH;
      const { x, y } = polar(geom.posX, geom.posY, radius, angle);
      return { seat, x, y };
    });
  }

  const rot = geom.rotation * DEG;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  return seats.map((seat) => {
    const lx = (seat.colIndex - (cols - 1) / 2) * SEAT_PITCH;
    const ly = (seat.rowIndex - (rows - 1) / 2) * SEAT_PITCH;
    return {
      seat,
      x: geom.posX + lx * cos - ly * sin,
      y: geom.posY + lx * sin + ly * cos,
    };
  });
}

/** SVG path outlining a section footprint (rotated rect for GRID, annular wedge for ARC). */
export function sectionOutlinePath(
  geometry: SectionGeometry | undefined | null,
  rows: number,
  cols: number,
): string {
  const geom = resolveGeometry(geometry);
  const pad = SEAT_PITCH * 0.65;

  if (geom.shape === "ARC") {
    const r0 = firstRowRadius(geom, cols);
    const rIn = Math.max(SEAT_PITCH, r0 - pad);
    const rOut = r0 + (rows - 1) * SEAT_PITCH + pad;
    const anglePad = (pad / r0) * (1 / DEG) * 0.6;
    const aStart = geom.rotation - geom.curve / 2 - anglePad;
    const aEnd = geom.rotation + geom.curve / 2 + anglePad;
    const large = aEnd - aStart > 180 ? 1 : 0;

    const p1 = polar(geom.posX, geom.posY, rIn, aStart);
    const p2 = polar(geom.posX, geom.posY, rOut, aStart);
    const p3 = polar(geom.posX, geom.posY, rOut, aEnd);
    const p4 = polar(geom.posX, geom.posY, rIn, aEnd);

    return [
      `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      `L ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
      `A ${rOut.toFixed(2)} ${rOut.toFixed(2)} 0 ${large} 1 ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
      `L ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
      `A ${rIn.toFixed(2)} ${rIn.toFixed(2)} 0 ${large} 0 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
      "Z",
    ].join(" ");
  }

  const halfW = ((cols - 1) / 2) * SEAT_PITCH + pad;
  const halfH = ((rows - 1) / 2) * SEAT_PITCH + pad;
  const rot = geom.rotation * DEG;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const corners = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ].map(([lx, ly]) => ({
    x: geom.posX + lx * cos - ly * sin,
    y: geom.posY + lx * sin + ly * cos,
  }));

  return (
    corners
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ") + " Z"
  );
}

/** Center point of a section footprint, used to place its label. */
export function sectionLabelPoint(
  geometry: SectionGeometry | undefined | null,
  rows: number,
  cols: number,
): { x: number; y: number } {
  const geom = resolveGeometry(geometry);
  if (geom.shape === "ARC") {
    const r0 = firstRowRadius(geom, cols);
    const rMid = r0 + ((rows - 1) / 2) * SEAT_PITCH;
    return polar(geom.posX, geom.posY, rMid, geom.rotation);
  }
  return { x: geom.posX, y: geom.posY };
}

export type Bounds = { minX: number; minY: number; width: number; height: number };

export function computeBounds(
  points: Array<{ x: number; y: number }>,
  margin = SEAT_PITCH * 2,
): Bounds {
  if (points.length === 0) {
    return { minX: -200, minY: -200, width: 400, height: 400 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return {
    minX: minX - margin,
    minY: minY - margin,
    width: maxX - minX + margin * 2,
    height: maxY - minY + margin * 2,
  };
}

export function mergeBounds(a: Bounds, b: Bounds): Bounds {
  const minX = Math.min(a.minX, b.minX);
  const minY = Math.min(a.minY, b.minY);
  const maxX = Math.max(a.minX + a.width, b.minX + b.width);
  const maxY = Math.max(a.minY + a.height, b.minY + b.height);
  return { minX, minY, width: maxX - minX, height: maxY - minY };
}

export type ResolvedFocalPoint = {
  kind: Exclude<SeatMapFocalPoint["kind"], "none">;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  shape: "rect" | "ellipse";
};

const FOCAL_DEFAULTS: Record<
  Exclude<SeatMapFocalPoint["kind"], "none">,
  { label: string; width: number; height: number; shape: "rect" | "ellipse" }
> = {
  stage: { label: "STAGE", width: 280, height: 52, shape: "rect" },
  field: { label: "FIELD", width: 280, height: 180, shape: "ellipse" },
  court: { label: "COURT", width: 240, height: 130, shape: "rect" },
  screen: { label: "SCREEN", width: 300, height: 30, shape: "rect" },
};

export function resolveFocalPoint(
  focal: SeatMapFocalPoint | null | undefined,
): ResolvedFocalPoint | null {
  if (!focal || focal.kind === "none") return null;
  const defaults = FOCAL_DEFAULTS[focal.kind];
  return {
    kind: focal.kind,
    label: focal.label?.trim() || defaults.label,
    x: focal.x ?? 0,
    y: focal.y ?? 0,
    width: focal.width ?? defaults.width,
    height: focal.height ?? defaults.height,
    shape: defaults.shape,
  };
}

/** Generate placeholder seats for editor previews (before a layout is saved). */
export function generatePreviewSeats(
  rowCount: number,
  seatsPerRow: number,
): Array<{ rowIndex: number; colIndex: number }> {
  const seats: Array<{ rowIndex: number; colIndex: number }> = [];
  for (let r = 0; r < Math.max(1, rowCount); r++) {
    for (let c = 0; c < Math.max(1, seatsPerRow); c++) {
      seats.push({ rowIndex: r, colIndex: c });
    }
  }
  return seats;
}
