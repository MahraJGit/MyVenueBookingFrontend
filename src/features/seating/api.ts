import { ApiError } from "@/lib/api/errors";
import { apiGet } from "@/lib/api/client";
import { authFetch } from "@/lib/api/auth-fetch";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, "Invalid response from server");
  }
}

type SuccessEnvelope<T> = {
  status?: string;
  message?: string;
  data: T;
};

function unwrapEnvelope<T>(json: SuccessEnvelope<T>): T {
  return json.data;
}

export type SeatStatus =
  | "available"
  | "held"
  | "held_by_me"
  | "sold"
  | "blocked"
  | "selected";

export type InventorySeatStatus =
  | "available"
  | "blocked"
  | "sold_online"
  | "sold_offline"
  | "held";

export type SectionShape = "GRID" | "ARC";

/** Venue-map placement of a section. GRID: pos = section center. ARC: pos = center of curvature. */
export type SectionGeometry = {
  shape?: SectionShape;
  posX?: number;
  posY?: number;
  /** Degrees. GRID: rotation about center. ARC: facing angle of the wedge. */
  rotation?: number;
  /** ARC only: sweep angle of the wedge in degrees. */
  curve?: number;
  /** ARC only: distance from center of curvature to the first row (0 = auto). */
  arcRadius?: number;
};

export type SeatMapFocalPoint = {
  kind: "stage" | "field" | "court" | "screen" | "none";
  label?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type PublicSeat = {
  id: string;
  label: string;
  rowLabel: string;
  seatNumber: number;
  rowIndex: number;
  colIndex: number;
  status: SeatStatus;
};

export type PublicSeatSection = SectionGeometry & {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
  ticketType: {
    id: string;
    name: string;
    price: number;
    currency: string;
    quantityTotal: number;
    quantitySold: number;
  };
  seats: PublicSeat[];
};

export type PublicSeatingMap = {
  eventId: string;
  slug: string;
  eventName: string;
  seatingEnabled: boolean;
  holdTtlSeconds: number;
  focalPoint?: SeatMapFocalPoint | null;
  sections: PublicSeatSection[];
};

export type SeatingSectionInput = SectionGeometry & {
  ticketTypeId: string;
  name: string;
  color: string;
  sortOrder?: number;
  rowCount: number;
  seatsPerRow: number;
  rowLabelStart?: string;
};

export type ManagedInventorySeat = {
  id: string;
  label: string;
  rowLabel: string;
  seatNumber: number;
  rowIndex: number;
  colIndex: number;
  isActive: boolean;
  offlineSold: boolean;
  offlineSoldNote: string | null;
  status: InventorySeatStatus;
};

export type ManagedSeatingLayout = {
  eventId: string;
  eventName?: string;
  slug?: string;
  seatingEnabled: boolean;
  focalPoint?: SeatMapFocalPoint | null;
  stats?: {
    available: number;
    blocked: number;
    soldOnline: number;
    soldOffline: number;
    held: number;
  };
  sections: Array<
    SectionGeometry & {
      id: string;
      ticketTypeId: string;
      name: string;
      color: string;
      sortOrder: number;
      seats: ManagedInventorySeat[];
    }
  >;
};

export type SeatingInventoryAction =
  | "block"
  | "unblock"
  | "mark_offline_sold"
  | "release_offline";

export type HoldSeatsResult = {
  holdId: string;
  expiresAt: string;
  expiresInSeconds: number;
  seats: Array<{
    id: string;
    label: string;
    ticketTypeId: string;
    sectionName: string;
    color: string;
  }>;
};

export async function getPublicSeatingMap(slug: string): Promise<PublicSeatingMap> {
  try {
    const res = await authFetch(`/api/events/${encodeURIComponent(slug)}/seating`, {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading seating map.",
    });
    const data = await parseJson<unknown>(res);
    if (res.ok) {
      return (data as SuccessEnvelope<PublicSeatingMap>).data;
    }
  } catch {
    // Fall through to public fetch
  }

  const json = await apiGet<SuccessEnvelope<PublicSeatingMap>>(
    `/api/events/${encodeURIComponent(slug)}/seating`,
  );
  return unwrapEnvelope(json);
}

export async function getManagedSeating(eventId: string): Promise<ManagedSeatingLayout> {
  const res = await authFetch(`/api/events/manage/${encodeURIComponent(eventId)}/seating`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading seating layout.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<ManagedSeatingLayout>).data;
}

export async function putManagedSeating(
  eventId: string,
  body: {
    seatingEnabled: boolean;
    sections: SeatingSectionInput[];
    focalPoint?: SeatMapFocalPoint | null;
  },
): Promise<ManagedSeatingLayout> {
  const res = await authFetch(`/api/events/manage/${encodeURIComponent(eventId)}/seating`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while saving seating layout.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<ManagedSeatingLayout>).data;
}

export async function applySeatingInventory(
  eventId: string,
  body: {
    action: SeatingInventoryAction;
    seatIds: string[];
    note?: string;
  },
): Promise<ManagedSeatingLayout> {
  const res = await authFetch(
    `/api/events/manage/${encodeURIComponent(eventId)}/seating/inventory`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating seat inventory.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    const err = ApiError.fromUnknown(res.status, data);
    (err as ApiError & { code?: string }).code = getSeatingErrorCode(data);
    throw err;
  }
  return (data as SuccessEnvelope<ManagedSeatingLayout>).data;
}

function getSeatingErrorCode(body: unknown): string | undefined {
  if (typeof body !== "object" || body === null) return undefined;
  const errors = (body as { errors?: { code?: string } }).errors;
  if (typeof errors === "object" && errors !== null && typeof errors.code === "string") {
    return errors.code;
  }
  return undefined;
}

export async function holdSeats(eventId: string, seatIds: string[]): Promise<HoldSeatsResult> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/seating/hold`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ seatIds }),
    networkErrorMessage: "Network error while holding seats.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<HoldSeatsResult>).data;
}

export async function releaseSeats(
  eventId: string,
  payload: { seatIds?: string[]; holdId?: string },
): Promise<void> {
  const res = await authFetch(`/api/events/${encodeURIComponent(eventId)}/seating/release`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    networkErrorMessage: "Network error while releasing seats.",
  });
  if (!res.ok) {
    const data = await parseJson<unknown>(res);
    throw ApiError.fromUnknown(res.status, data);
  }
}
