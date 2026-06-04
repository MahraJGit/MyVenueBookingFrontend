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

export type TicketTypeRow = {
  id?: string;
  name: string;
  price: number;
  currency: string;
  quantityTotal: number;
  quantitySold?: number;
  salesStart?: string | null;
  salesEnd?: string | null;
};

export type EventApprovalStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "INACTIVE"
  | "CANCELLED"
  | "COMPLETED";

export type ManagedEvent = {
  id: string;
  eventName: string;
  slug: string;
  eventDescription: string | null;
  startDateTime: string;
  endDateTime: string;
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
  status?: EventApprovalStatus;
  createdAt?: string;
  vendorProfileId?: string | null;
  vendorProfile?: {
    id: string;
    vendorName: string;
    email: string;
  } | null;
  ticketTypes: TicketTypeRow[];
};

export type ListManagedResult = {
  data: ManagedEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type PublicEvent = {
  id: string;
  eventName: string;
  slug: string;
  eventDescription: string | null;
  startDateTime: string;
  endDateTime: string;
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
  ticketTypes: TicketTypeRow[];
};

export type ListPublicEventsResult = {
  data: PublicEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ListPublicEventsParams = {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  city?: string;
  sortBy?: "createdAt" | "startDateTime" | "eventName";
  sortOrder?: "asc" | "desc";
};

export type CreateEventPayload = {
  eventName: string;
  eventDescription: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  category: string;
  tags: string[];
  coverImage: string;
  gallery: string[];
  /** Optional link to an existing venue row */
  venueId?: string;
  venueName: string;
  venuePhone: string;
  venueWebsite: string;
  countryCode: string;
  city: string;
  state: string;
  address: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  locationSource: "VENUE" | "CUSTOM";
  ticketTypes: {
    name: string;
    price: number;
    currency: string;
    quantityTotal: number;
    salesStart?: string;
    salesEnd?: string;
  }[];
};

export async function listPublicEvents(
  params?: ListPublicEventsParams,
): Promise<ListPublicEventsResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 10));
  if (params?.search) sp.set("search", params.search);
  if (params?.category) sp.set("category", params.category);
  if (params?.city) sp.set("city", params.city);
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  const json = await apiGet<SuccessEnvelope<ListPublicEventsResult>>(
    `/api/events?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

export async function getPublicEventBySlug(slug: string): Promise<PublicEvent> {
  const json = await apiGet<SuccessEnvelope<PublicEvent>>(
    `/api/events/${encodeURIComponent(slug)}`,
  );
  return unwrapEnvelope(json);
}

export async function listManagedEvents(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: EventApprovalStatus;
  vendorOnly?: boolean;
  sortBy?: "createdAt" | "startDateTime" | "eventName";
  sortOrder?: "asc" | "desc";
}): Promise<ListManagedResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 50));
  if (params?.search) sp.set("search", params.search);
  if (params?.status) sp.set("status", params.status);
  if (params?.vendorOnly) sp.set("vendorOnly", "true");
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  const res = await authFetch(`/api/events/manage?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading events.",
  });

  const json = await parseJson<SuccessEnvelope<ListManagedResult>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function getManagedEvent(id: string): Promise<ManagedEvent> {
  const res = await authFetch(`/api/events/manage/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading event.",
  });

  const json = await parseJson<SuccessEnvelope<ManagedEvent>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function createEvent(body: CreateEventPayload): Promise<ManagedEvent> {
  const res = await authFetch("/api/events", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating event.",
  });

  const json = await parseJson<SuccessEnvelope<ManagedEvent>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function updateEvent(
  id: string,
  body: Partial<CreateEventPayload>,
): Promise<ManagedEvent> {
  const res = await authFetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while updating event.",
  });

  const json = await parseJson<SuccessEnvelope<ManagedEvent>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function updateEventStatus(
  id: string,
  body: { status: "APPROVED" | "REJECTED"; reason?: string },
): Promise<ManagedEvent> {
  const res = await authFetch(`/api/events/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while updating event status.",
  });

  const json = await parseJson<SuccessEnvelope<ManagedEvent>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function deleteEvent(id: string): Promise<void> {
  const res = await authFetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deleting event.",
  });

  if (!res.ok) {
    const json = await parseJson<unknown>(res);
    throw ApiError.fromUnknown(res.status, json);
  }
}

/** Upload image/file for cover or gallery — returns public-style URL stored in DB. */
export async function uploadEventMedia(file: File): Promise<string> {
  const folder = "event-media";
  const formData = new FormData();
  formData.append("file", file);

  const res = await authFetch(
    `/api/uploads/single?folder=${encodeURIComponent(folder)}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
      networkErrorMessage: "Network error while uploading file.",
    },
  );

  const json = await parseJson<{
    success?: boolean;
    data?: { url?: string };
    message?: string;
  }>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  const url = json.data?.url;
  if (!url) {
    throw new ApiError(res.status, "Upload response missing URL");
  }
  return url;
}
