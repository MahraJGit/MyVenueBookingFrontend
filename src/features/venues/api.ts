import { ApiError } from "@/lib/api/errors";
import { apiGet } from "@/lib/api/client";
import { authFetch } from "@/lib/api/auth-fetch";
import { uploadSingleFile } from "@/features/uploads/upload-single";
import type {
  AmenityCatalogItem,
  CreateVenuePayload,
  DayAvailability,
  ListManagedVenuesResult,
  ListPublicVenuesResult,
  ManagedVenue,
  MonthAvailabilityDay,
  PublicVenue,
  UpdateVenuePayload,
  VenueAmenity,
  VenueAmenityPayload,
  VenueBlock,
  VenueBlockPayload,
  VenueOfflineBookingPayload,
  VenueOpsDay,
  VenuePricing,
  VenuePricingPayload,
  VenueSchedule,
  VenueSchedulesPayload,
  VenueStatusPayload,
  VenueType,
  EntityStatus,
} from "./types";

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

async function authJson<T>(
  path: string,
  init: RequestInit & { networkErrorMessage: string },
): Promise<T> {
  const res = await authFetch(path, init);
  const json = await parseJson<SuccessEnvelope<T>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

async function authVoid(
  path: string,
  init: RequestInit & { networkErrorMessage: string },
): Promise<void> {
  const res = await authFetch(path, init);
  if (!res.ok) {
    const json = await parseJson<unknown>(res);
    throw ApiError.fromUnknown(res.status, json);
  }
}

// ─── Public ────────────────────────────────────────────────────

export async function listPublicVenues(params?: {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  countryCode?: string;
  venueTypeId?: string;
  capacityMin?: number;
  capacityMax?: number;
  sortBy?: "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}): Promise<ListPublicVenuesResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 10));
  if (params?.search) sp.set("search", params.search);
  if (params?.city) sp.set("city", params.city);
  if (params?.countryCode) sp.set("countryCode", params.countryCode);
  if (params?.venueTypeId) sp.set("venueTypeId", params.venueTypeId);
  if (params?.capacityMin !== undefined) sp.set("capacityMin", String(params.capacityMin));
  if (params?.capacityMax !== undefined) sp.set("capacityMax", String(params.capacityMax));
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  const json = await apiGet<SuccessEnvelope<ListPublicVenuesResult>>(
    `/api/venues?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

export async function getPublicVenue(id: string): Promise<PublicVenue> {
  const json = await apiGet<SuccessEnvelope<PublicVenue>>(
    `/api/venues/${encodeURIComponent(id)}`,
  );
  return unwrapEnvelope(json);
}

export async function getPreviewVenue(id: string): Promise<PublicVenue> {
  const res = await authFetch(`/api/venues/preview/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading venue preview.",
  });

  const json = await parseJson<SuccessEnvelope<PublicVenue>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function listVenueTypes(): Promise<VenueType[]> {
  const json = await apiGet<SuccessEnvelope<VenueType[]>>("/api/venues/types");
  return unwrapEnvelope(json);
}

export async function listAmenityCatalog(): Promise<AmenityCatalogItem[]> {
  const json = await apiGet<SuccessEnvelope<AmenityCatalogItem[]>>(
    "/api/venues/amenity-catalog",
  );
  return unwrapEnvelope(json);
}

export async function getMonthAvailability(
  venueId: string,
  year: number,
  month: number,
): Promise<MonthAvailabilityDay[]> {
  const sp = new URLSearchParams({
    year: String(year),
    month: String(month),
  });
  const json = await apiGet<SuccessEnvelope<MonthAvailabilityDay[]>>(
    `/api/venues/${encodeURIComponent(venueId)}/availability/month?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

export async function getDayAvailability(
  venueId: string,
  date: string,
): Promise<DayAvailability> {
  const sp = new URLSearchParams({ date });
  const json = await apiGet<SuccessEnvelope<DayAvailability>>(
    `/api/venues/${encodeURIComponent(venueId)}/availability/day?${sp.toString()}`,
  );
  return unwrapEnvelope(json);
}

// ─── Managed ───────────────────────────────────────────────────

export async function listManagedVenues(params?: {
  page?: number;
  limit?: number;
  search?: string;
  city?: string;
  venueTypeId?: string;
  capacityMin?: number;
  capacityMax?: number;
  status?: EntityStatus;
  vendorOnly?: boolean;
  allPlatform?: boolean;
  mine?: boolean;
  readyForReview?: boolean;
  sortBy?: "createdAt" | "name";
  sortOrder?: "asc" | "desc";
}): Promise<ListManagedVenuesResult> {
  const sp = new URLSearchParams();
  sp.set("page", String(params?.page ?? 1));
  sp.set("limit", String(params?.limit ?? 10));
  if (params?.search) sp.set("search", params.search);
  if (params?.city) sp.set("city", params.city);
  if (params?.venueTypeId) sp.set("venueTypeId", params.venueTypeId);
  if (params?.capacityMin !== undefined) sp.set("capacityMin", String(params.capacityMin));
  if (params?.capacityMax !== undefined) sp.set("capacityMax", String(params.capacityMax));
  if (params?.status) sp.set("status", params.status);
  if (params?.vendorOnly) sp.set("vendorOnly", "true");
  if (params?.allPlatform) sp.set("allPlatform", "true");
  if (params?.mine) sp.set("mine", "true");
  if (params?.readyForReview) sp.set("readyForReview", "true");
  if (params?.sortBy) sp.set("sortBy", params.sortBy);
  if (params?.sortOrder) sp.set("sortOrder", params.sortOrder);

  return authJson<ListManagedVenuesResult>(`/api/venues/manage?${sp.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading venues.",
  });
}

export async function getManagedVenue(id: string): Promise<ManagedVenue> {
  return authJson<ManagedVenue>(`/api/venues/manage/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading venue.",
  });
}

export async function createVenue(body: CreateVenuePayload): Promise<ManagedVenue> {
  return authJson<ManagedVenue>("/api/venues", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating venue.",
  });
}

export async function updateVenue(id: string, body: UpdateVenuePayload): Promise<ManagedVenue> {
  return authJson<ManagedVenue>(`/api/venues/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while updating venue.",
  });
}

export async function deleteVenue(id: string): Promise<void> {
  return authVoid(`/api/venues/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deactivating venue.",
  });
}

export async function submitVenueForReview(id: string): Promise<ManagedVenue> {
  return authJson<ManagedVenue>(`/api/venues/${encodeURIComponent(id)}/submit`, {
    method: "POST",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while submitting venue for review.",
  });
}

export async function updateVenueStatus(
  id: string,
  body: VenueStatusPayload,
): Promise<ManagedVenue> {
  return authJson<ManagedVenue>(`/api/venues/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while updating venue status.",
  });
}

export async function upsertVenuePricing(
  id: string,
  body: VenuePricingPayload,
): Promise<VenuePricing> {
  return authJson<VenuePricing>(`/api/venues/${encodeURIComponent(id)}/pricing`, {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while saving pricing.",
  });
}

export async function replaceVenueSchedules(
  id: string,
  body: VenueSchedulesPayload,
): Promise<VenueSchedule[]> {
  return authJson<VenueSchedule[]>(`/api/venues/${encodeURIComponent(id)}/schedules`, {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while saving schedules.",
  });
}

export async function addVenueBlock(
  id: string,
  body: VenueBlockPayload,
): Promise<VenueBlock> {
  return authJson<VenueBlock>(`/api/venues/${encodeURIComponent(id)}/blocks`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while adding block date.",
  });
}

export async function removeVenueBlock(venueId: string, blockId: string): Promise<void> {
  return authVoid(
    `/api/venues/${encodeURIComponent(venueId)}/blocks/${encodeURIComponent(blockId)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while removing block date.",
    },
  );
}

export async function getVenueOpsDay(
  venueId: string,
  date: string,
): Promise<VenueOpsDay> {
  const sp = new URLSearchParams({ date });
  return authJson<VenueOpsDay>(
    `/api/venues/${encodeURIComponent(venueId)}/ops/day?${sp.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading venue schedule day.",
    },
  );
}

export async function closeVenueScheduleDay(
  venueId: string,
  date: string,
  reason?: string,
): Promise<VenueBlock> {
  return authJson<VenueBlock>(
    `/api/venues/${encodeURIComponent(venueId)}/schedule/close-day`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ date, reason }),
      networkErrorMessage: "Network error while closing venue day.",
    },
  );
}

export async function openVenueScheduleDay(
  venueId: string,
  date: string,
): Promise<{ opened: boolean; removedBlockId: string | null }> {
  return authJson<{ opened: boolean; removedBlockId: string | null }>(
    `/api/venues/${encodeURIComponent(venueId)}/schedule/open-day`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
      networkErrorMessage: "Network error while opening venue day.",
    },
  );
}

export async function createVenueOfflineBooking(
  venueId: string,
  body: VenueOfflineBookingPayload,
): Promise<unknown> {
  return authJson<unknown>(
    `/api/venues/${encodeURIComponent(venueId)}/offline-bookings`,
    {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while recording local booking.",
    },
  );
}

export async function upsertVenueAmenity(
  id: string,
  body: VenueAmenityPayload,
): Promise<VenueAmenity> {
  return authJson<VenueAmenity>(`/api/venues/${encodeURIComponent(id)}/amenities`, {
    method: "PUT",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while saving amenity.",
  });
}

export async function removeVenueAmenity(venueId: string, amenityId: string): Promise<void> {
  return authVoid(
    `/api/venues/${encodeURIComponent(venueId)}/amenities/${encodeURIComponent(amenityId)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while removing amenity.",
    },
  );
}

export async function createVenueType(body: {
  name: string;
  description?: string;
}): Promise<VenueType> {
  return authJson<VenueType>("/api/venues/types", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating venue type.",
  });
}

export async function deleteVenueType(id: string): Promise<void> {
  return authVoid(`/api/venues/types/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deleting venue type.",
  });
}

export async function createAmenityCatalogItem(body: {
  name: string;
  description?: string;
}): Promise<AmenityCatalogItem> {
  return authJson<AmenityCatalogItem>("/api/venues/amenity-catalog", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating amenity catalog item.",
  });
}

export async function deleteAmenityCatalogItem(id: string): Promise<void> {
  return authVoid(`/api/venues/amenity-catalog/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deleting amenity catalog item.",
  });
}

export async function uploadVenueMedia(file: File): Promise<string> {
  return uploadSingleFile(file, "venue-media");
}
