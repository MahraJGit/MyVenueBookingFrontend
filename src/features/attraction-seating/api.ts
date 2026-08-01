import { ApiError } from "@/lib/api/errors";
import { apiGet } from "@/lib/api/client";
import { authFetch } from "@/lib/api/auth-fetch";
import type {
  HoldSeatsResult,
  PublicSeat,
  PublicSeatSection,
  SeatingInventoryAction,
  SeatingSectionInput,
  SeatMapFocalPoint,
  SectionGeometry,
} from "@/features/seating/api";

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

export type {
  SeatingSectionInput,
  HoldSeatsResult,
  PublicSeat,
  PublicSeatSection,
  SeatMapFocalPoint,
  SectionGeometry,
};

export type AttractionPublicSeatingMap = {
  occurrenceId: string;
  attractionId: string;
  slug: string;
  name: string;
  seatingEnabled: boolean;
  holdTtlSeconds: number;
  focalPoint?: SeatMapFocalPoint | null;
  sections: PublicSeatSection[];
};

export type AttractionManagedSeatingLayout = {
  attractionId: string;
  name?: string;
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
  applySummary?: {
    updatedShows: number;
    preservedShows: number;
  };
  sections: Array<
    SectionGeometry & {
      id: string;
      ticketTypeId: string;
      name: string;
      color: string;
      sortOrder: number;
      seats: Array<{
        id: string;
        label: string;
        rowLabel: string;
        seatNumber: number;
        rowIndex: number;
        colIndex: number;
        isActive: boolean;
        status: string;
        offlineSold?: boolean;
        offlineSoldNote?: string | null;
      }>;
    }
  >;
};

export async function getAttractionOccurrenceSeating(
  occurrenceId: string,
): Promise<AttractionPublicSeatingMap> {
  try {
    const res = await authFetch(
      `/api/attractions/occurrences/${encodeURIComponent(occurrenceId)}/seating`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        networkErrorMessage: "Network error while loading seating map.",
      },
    );
    const data = await parseJson<unknown>(res);
    if (res.ok) {
      return (data as SuccessEnvelope<AttractionPublicSeatingMap>).data;
    }
  } catch {
    // Fall through to public fetch
  }

  const json = await apiGet<SuccessEnvelope<AttractionPublicSeatingMap>>(
    `/api/attractions/occurrences/${encodeURIComponent(occurrenceId)}/seating`,
  );
  return unwrapEnvelope(json);
}

export async function getManagedAttractionSeating(
  attractionId: string,
): Promise<AttractionManagedSeatingLayout> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/seating`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading seating layout.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<AttractionManagedSeatingLayout>).data;
}

export async function putManagedAttractionSeating(
  attractionId: string,
  body: {
    seatingEnabled: boolean;
    sections: SeatingSectionInput[];
    focalPoint?: SeatMapFocalPoint | null;
  },
): Promise<AttractionManagedSeatingLayout> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/seating`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while saving seating layout.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<AttractionManagedSeatingLayout>).data;
}

export async function holdAttractionSeats(
  occurrenceId: string,
  seatIds: string[],
): Promise<HoldSeatsResult> {
  const res = await authFetch(
    `/api/attractions/occurrences/${encodeURIComponent(occurrenceId)}/seating/hold`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ seatIds }),
      networkErrorMessage: "Network error while holding seats.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<HoldSeatsResult>).data;
}

export async function releaseAttractionSeats(
  occurrenceId: string,
  payload: { seatIds?: string[]; holdId?: string },
): Promise<void> {
  const res = await authFetch(
    `/api/attractions/occurrences/${encodeURIComponent(occurrenceId)}/seating/release`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      networkErrorMessage: "Network error while releasing seats.",
    },
  );
  if (!res.ok) {
    const data = await parseJson<unknown>(res);
    throw ApiError.fromUnknown(res.status, data);
  }
}

export type AttractionManagedOccurrenceSeating = {
  occurrenceId: string;
  attractionId: string;
  attractionName: string;
  slotName?: string | null;
  startDateTime?: string;
  seatingEnabled: boolean;
  stats?: {
    available: number;
    blocked: number;
    soldOnline: number;
    soldOffline: number;
    held: number;
  };
  sections: Array<{
    id: string;
    ticketTypeId: string;
    name: string;
    color: string;
    sortOrder: number;
    seats: Array<{
      id: string;
      label: string;
      rowLabel: string;
      seatNumber: number;
      rowIndex: number;
      colIndex: number;
      isActive: boolean;
      status: string;
      offlineSold?: boolean;
      offlineSoldNote?: string | null;
    }>;
  }>;
};

export async function getManagedAttractionOccurrenceSeating(
  occurrenceId: string,
): Promise<AttractionManagedOccurrenceSeating> {
  const res = await authFetch(
    `/api/attractions/manage/occurrences/${encodeURIComponent(occurrenceId)}/seating/inventory`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading seat inventory.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<AttractionManagedOccurrenceSeating>).data;
}

export async function applyAttractionSeatingInventory(
  occurrenceId: string,
  body: {
    action: SeatingInventoryAction;
    seatIds: string[];
    note?: string;
  },
): Promise<AttractionManagedOccurrenceSeating> {
  const res = await authFetch(
    `/api/attractions/manage/occurrences/${encodeURIComponent(occurrenceId)}/seating/inventory`,
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
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<AttractionManagedOccurrenceSeating>).data;
}
