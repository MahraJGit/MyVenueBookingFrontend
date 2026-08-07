import { ApiError } from "@/lib/api/errors";
import { apiGet } from "@/lib/api/client";
import { authFetch } from "@/lib/api/auth-fetch";
import { uploadSingleFile } from "@/features/uploads/upload-single";

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

export type AttractionApprovalStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "INACTIVE"
  | "CANCELLED"
  | "COMPLETED";

export type SalePhase = "not_started" | "open" | "ended" | "sold_out";

export type AttractionTicketType = {
  id?: string;
  name: string;
  price: number;
  currency: string;
  quantityPerOccurrence: number;
  isActive?: boolean;
  salesOpenMinutesBefore?: number | null;
  salesCloseMinutesBefore?: number | null;
};

export type AttractionInventory = {
  id: string;
  name: string;
  price: number | string;
  currency: string;
  quantityTotal: number;
  quantitySold: number;
  quantityOfflineSold?: number;
  remaining: number;
  salesStart?: string | null;
  salesEnd?: string | null;
  isActive?: boolean;
  salePhase?: SalePhase;
};

export type AttractionSlotTemplate = {
  name: string;
  startTime: string;
  endTime: string;
};

export type AttractionOccurrenceSummary = {
  id: string;
  startDateTime: string;
  endDateTime: string;
  scheduleKey: string;
  slotName?: string | null;
  status: string;
  seatingEnabled?: boolean;
  inventories?: AttractionInventory[];
};

export type PublicVendorProfile = {
  id: string;
  vendorName: string;
  businessType: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
};

export type PublicAttraction = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  category: string | null;
  tags: string[];
  coverImage: string | null;
  thumbnail: string | null;
  gallery: string[];
  venueId: string | null;
  venueName: string | null;
  venuePhone: string | null;
  venueWebsite: string | null;
  countryCode: string;
  city: string;
  state: string | null;
  address: string | null;
  zipCode: string | null;
  latitude: string | number;
  longitude: string | number;
  seatingEnabled?: boolean;
  scheduleStartDate?: string;
  scheduleEndDate?: string | null;
  daysOfWeek?: number[];
  slots?: AttractionSlotTemplate[];
  fromPrice: number | null;
  nextOccurrence: AttractionOccurrenceSummary | null;
  salePhase?: SalePhase;
  vendorProfile: PublicVendorProfile | null;
  ticketTypes: AttractionTicketType[];
  occurrences?: AttractionOccurrenceSummary[];
};

export type ManagedAttraction = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  category: string | null;
  tags: string[];
  coverImage: string | null;
  thumbnail: string | null;
  gallery: string[];
  venueId: string | null;
  venueName: string | null;
  venuePhone: string | null;
  venueWebsite: string | null;
  countryCode: string;
  city: string;
  state: string | null;
  address: string | null;
  zipCode: string | null;
  latitude: string | number;
  longitude: string | number;
  locationSource: "VENUE" | "CUSTOM";
  seatingEnabled?: boolean;
  scheduleStartDate: string;
  scheduleEndDate: string | null;
  daysOfWeek: number[];
  slots: AttractionSlotTemplate[];
  materializeHorizonDays?: number;
  /** Minutes before each occurrence start when gate scanning opens. */
  entryOpenMinutesBefore?: number;
  status?: AttractionApprovalStatus;
  isDeleted?: boolean;
  /** True when active ticket sales lock structural edits. */
  contentOnlyEdit?: boolean;
  createdAt?: string;
  createdByUserId?: string | null;
  vendorProfileId?: string | null;
  vendorProfile?: {
    id: string;
    vendorName: string;
    email: string;
  } | null;
  ticketTypes: AttractionTicketType[];
  blackouts?: Array<{ id?: string; date: string; reason?: string | null }>;
  occurrences?: AttractionOccurrenceSummary[];
};

export type ListPublicAttractionsResult = {
  data: PublicAttraction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ListManagedAttractionsResult = {
  data: ManagedAttraction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ListPublicAttractionsParams = {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  category?: string;
  countryCode?: string;
  sortBy?: "createdAt" | "name" | "scheduleStartDate";
  sortOrder?: "asc" | "desc";
};

export type CreateAttractionPayload = {
  name: string;
  description?: string | null;
  timezone: string;
  category?: string | null;
  tags: string[];
  coverImage: string;
  thumbnail?: string | null;
  gallery: string[];
  venueId?: string | null;
  venueName?: string | null;
  venuePhone: string;
  venueWebsite?: string | null;
  countryCode: string;
  city: string;
  state?: string | null;
  address?: string | null;
  zipCode?: string | null;
  latitude: number;
  longitude: number;
  locationSource: "VENUE" | "CUSTOM";
  seatingEnabled?: boolean;
  daysOfWeek: number[];
  slots: AttractionSlotTemplate[];
  materializeHorizonDays?: number;
  /** Minutes before each occurrence start when gate scanning opens (default 60). */
  entryOpenMinutesBefore?: number;
  ticketTypes: Array<{
    name: string;
    price: number;
    currency?: string;
    quantityPerOccurrence: number;
    salesOpenMinutesBefore?: number | null;
    salesCloseMinutesBefore?: number | null;
  }>;
};

export type AttractionAvailability = {
  attractionId: string;
  slug: string;
  date: string;
  timezone: string;
  seatingEnabled: boolean;
  slots: Array<{
    occurrenceId: string;
    scheduleKey: string;
    slotName?: string | null;
    startDateTime: string;
    endDateTime: string;
    status: string;
    inventories: AttractionInventory[];
  }>;
};

export type PublicOccurrence = {
  id: string;
  scheduleKey: string;
  slotName?: string | null;
  startDateTime: string;
  endDateTime: string;
  status: string;
  seatingEnabled: boolean;
  inventories: AttractionInventory[];
  attraction: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
    coverImage: string | null;
    city: string;
    countryCode: string;
    seatingEnabled: boolean;
  };
};

export async function listPublicAttractions(
  params?: ListPublicAttractionsParams,
): Promise<ListPublicAttractionsResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 10));
  if (params?.search) sp.set("search", params.search);
  if (params?.city) sp.set("city", params.city);
  if (params?.category) sp.set("category", params.category);
  if (params?.countryCode) sp.set("countryCode", params.countryCode);
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  const json = await apiGet<SuccessEnvelope<ListPublicAttractionsResult>>(
    `/api/attractions?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

export async function getPublicAttractionBySlug(
  slug: string,
): Promise<PublicAttraction> {
  const json = await apiGet<SuccessEnvelope<PublicAttraction>>(
    `/api/attractions/${encodeURIComponent(slug)}`,
  );
  return unwrapEnvelope(json);
}

export async function getAttractionAvailability(
  slug: string,
  date: string,
): Promise<AttractionAvailability> {
  const sp = new URLSearchParams({ date });
  const json = await apiGet<SuccessEnvelope<AttractionAvailability>>(
    `/api/attractions/${encodeURIComponent(slug)}/availability?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

export type AttractionMonthAvailabilityDay = {
  date: string;
  available: boolean;
  reason?: "BLOCKED" | "CLOSED" | "FULLY_BOOKED" | "OUT_OF_WINDOW";
};

export type AttractionMonthAvailability = {
  attractionId: string;
  slug: string;
  month: string;
  timezone: string;
  bookingHorizonDays?: number;
  days: AttractionMonthAvailabilityDay[];
};

export async function getAttractionMonthAvailability(
  slug: string,
  month: string,
): Promise<AttractionMonthAvailability> {
  const sp = new URLSearchParams({ month });
  const json = await apiGet<SuccessEnvelope<AttractionMonthAvailability>>(
    `/api/attractions/${encodeURIComponent(slug)}/availability/month?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

export async function getPublicOccurrence(
  occurrenceId: string,
): Promise<PublicOccurrence> {
  const json = await apiGet<SuccessEnvelope<PublicOccurrence>>(
    `/api/attractions/occurrences/${encodeURIComponent(occurrenceId)}`,
  );
  return unwrapEnvelope(json);
}

export async function listManagedAttractions(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: AttractionApprovalStatus;
  vendorOnly?: boolean;
  sortBy?: "createdAt" | "name" | "scheduleStartDate";
  sortOrder?: "asc" | "desc";
}): Promise<ListManagedAttractionsResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 50));
  if (params?.search) sp.set("search", params.search);
  if (params?.status) sp.set("status", params.status);
  if (params?.vendorOnly) sp.set("vendorOnly", "true");
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  const res = await authFetch(`/api/attractions/manage?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading attractions.",
  });

  const json = await parseJson<SuccessEnvelope<ListManagedAttractionsResult>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function getManagedAttraction(
  id: string,
): Promise<ManagedAttraction> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading attraction.",
    },
  );

  const json = await parseJson<SuccessEnvelope<ManagedAttraction>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

/** Owner or admin reviewer — read-only detail for review modals. */
export async function getPreviewAttraction(
  id: string,
): Promise<ManagedAttraction> {
  const res = await authFetch(
    `/api/attractions/preview/id/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading attraction preview.",
    },
  );

  const json = await parseJson<SuccessEnvelope<ManagedAttraction>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function createAttraction(
  body: CreateAttractionPayload,
): Promise<ManagedAttraction> {
  const res = await authFetch("/api/attractions", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating attraction.",
  });

  const json = await parseJson<SuccessEnvelope<ManagedAttraction>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function updateAttraction(
  id: string,
  body: Partial<CreateAttractionPayload>,
): Promise<ManagedAttraction> {
  const res = await authFetch(`/api/attractions/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while updating attraction.",
  });

  const json = await parseJson<SuccessEnvelope<ManagedAttraction>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function updateAttractionStatus(
  id: string,
  body: {
    status: "APPROVED" | "REJECTED" | "ACTIVE" | "INACTIVE" | "CANCELLED";
    reason?: string;
  },
): Promise<ManagedAttraction> {
  const res = await authFetch(
    `/api/attractions/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating attraction status.",
    },
  );

  const json = await parseJson<SuccessEnvelope<ManagedAttraction>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function deleteAttraction(id: string): Promise<void> {
  const res = await authFetch(`/api/attractions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deleting attraction.",
  });

  if (!res.ok) {
    const json = await parseJson<unknown>(res);
    throw ApiError.fromUnknown(res.status, json);
  }
}

export async function restoreAttraction(id: string): Promise<ManagedAttraction> {
  const res = await authFetch(
    `/api/attractions/${encodeURIComponent(id)}/restore`,
    {
      method: "POST",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while restoring attraction.",
    },
  );

  const json = await parseJson<SuccessEnvelope<ManagedAttraction>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export type ManagedOccurrence = AttractionOccurrenceSummary & {
  attractionId?: string;
  inventories: AttractionInventory[];
};

export type ListManagedOccurrencesResult = {
  data: ManagedOccurrence[];
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function listManagedAttractionOccurrences(
  attractionId: string,
  params?: { from?: string; to?: string; status?: string; page?: number; limit?: number },
): Promise<ListManagedOccurrencesResult> {
  const sp = new URLSearchParams();
  if (params?.from) sp.set("from", params.from);
  if (params?.to) sp.set("to", params.to);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.limit) sp.set("limit", String(params.limit));
  const qs = sp.toString();

  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/occurrences${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading shows.",
    },
  );

  const json = await parseJson<SuccessEnvelope<ListManagedOccurrencesResult | ManagedOccurrence[]>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  const payload = unwrapEnvelope(json);
  if (Array.isArray(payload)) {
    return { data: payload };
  }
  return payload;
}

export async function cancelAttractionOccurrence(
  attractionId: string,
  occurrenceId: string,
  reason?: string,
): Promise<ManagedOccurrence> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/occurrences/${encodeURIComponent(occurrenceId)}/cancel`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
      networkErrorMessage: "Network error while cancelling show.",
    },
  );

  const json = await parseJson<SuccessEnvelope<ManagedOccurrence>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function recordAttractionOccurrenceOfflineSales(
  attractionId: string,
  occurrenceId: string,
  updates: Array<{ inventoryId: string; delta: number }>,
): Promise<ManagedOccurrence> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/occurrences/${encodeURIComponent(occurrenceId)}/offline-sales`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ updates }),
      networkErrorMessage: "Network error while updating local sales.",
    },
  );

  const json = await parseJson<SuccessEnvelope<ManagedOccurrence>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export type AttractionScheduleMonthDay = {
  date: string;
  scheduledCount: number;
  cancelledCount: number;
  completedCount: number;
  closed: boolean;
};

export type AttractionScheduleMonth = {
  attractionId: string;
  month: string;
  timezone: string;
  days: AttractionScheduleMonthDay[];
};

export type AttractionScheduleDay = {
  attractionId: string;
  date: string;
  timezone: string;
  closed: boolean;
  closeReason: string | null;
  templateSlots: AttractionSlotTemplate[];
  occurrences: ManagedOccurrence[];
};

export async function getAttractionScheduleMonth(
  attractionId: string,
  month: string,
): Promise<AttractionScheduleMonth> {
  const sp = new URLSearchParams({ month });
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/schedule?${sp}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading schedule.",
    },
  );
  const json = await parseJson<SuccessEnvelope<AttractionScheduleMonth>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function getAttractionScheduleDay(
  attractionId: string,
  date: string,
): Promise<AttractionScheduleDay> {
  const sp = new URLSearchParams({ date });
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/schedule/day?${sp}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading day schedule.",
    },
  );
  const json = await parseJson<SuccessEnvelope<AttractionScheduleDay>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function closeAttractionScheduleDay(
  attractionId: string,
  date: string,
  reason?: string,
): Promise<AttractionScheduleDay> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/schedule/close-day`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date, reason }),
      networkErrorMessage: "Network error while closing day.",
    },
  );
  const json = await parseJson<SuccessEnvelope<AttractionScheduleDay>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function openAttractionScheduleDay(
  attractionId: string,
  date: string,
): Promise<AttractionScheduleDay> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/schedule/open-day`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ date }),
      networkErrorMessage: "Network error while opening day.",
    },
  );
  const json = await parseJson<SuccessEnvelope<AttractionScheduleDay>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function createAttractionOccurrence(
  attractionId: string,
  body: {
    date: string;
    name: string;
    startTime: string;
    endTime: string;
  },
): Promise<ManagedOccurrence> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/occurrences`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while adding show.",
    },
  );
  const json = await parseJson<SuccessEnvelope<ManagedOccurrence>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function updateAttractionOccurrence(
  attractionId: string,
  occurrenceId: string,
  body: {
    name?: string;
    startTime?: string;
    endTime?: string;
  },
): Promise<ManagedOccurrence> {
  const res = await authFetch(
    `/api/attractions/manage/${encodeURIComponent(attractionId)}/occurrences/${encodeURIComponent(occurrenceId)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating show.",
    },
  );
  const json = await parseJson<SuccessEnvelope<ManagedOccurrence>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

/** Upload image/file for cover or gallery — returns public-style URL stored in DB. */
export async function uploadAttractionMedia(file: File): Promise<string> {
  return uploadSingleFile(file, "attraction-media");
}
