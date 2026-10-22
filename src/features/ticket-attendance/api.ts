import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

type SuccessEnvelope<T> = { success: true; data: T };

export type AttendanceScope = "workspace" | "platform";

export type AttendanceProgress = {
  sold: number;
  checkedIn: number;
  remaining: number;
};

export type AttendanceListing = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  status: string;
  vendorId: string | null;
  vendorName: string | null;
  startDateTime?: string;
  endDateTime?: string;
  city?: string;
};

export type AttendanceCheckIn = {
  id: string;
  fullName: string;
  seatLabel: string | null;
  entryLabel: string | null;
  checkInTime: string | null;
  ticketName: string | null;
  verifier: {
    id: string;
    displayName: string;
    username: string;
  } | null;
};

export type AttendanceScan = {
  id: string;
  result: string;
  qrToken: string | null;
  gateId: string | null;
  occurrenceId: string | null;
  attendeeId: string | null;
  attendeeName: string | null;
  seatLabel: string | null;
  createdAt: string;
  verifier: {
    id: string;
    displayName: string;
    username: string;
  };
};

export type AttendanceSummary = {
  resourceType: "event" | "attraction";
  resourceId: string;
  occurrenceId?: string;
  name: string;
  slug: string;
  timezone: string;
  startDateTime?: string;
  endDateTime?: string;
  slotName?: string | null;
  status: string;
  progress: AttendanceProgress;
  recentCheckIns: AttendanceCheckIn[];
};

export type AttendanceOccurrence = {
  id: string;
  slotName: string | null;
  scheduleKey: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  progress: AttendanceProgress;
};

function scopeParams(scope: AttendanceScope, vendorId?: string) {
  const search = new URLSearchParams();
  search.set("scope", scope);
  if (vendorId) search.set("vendorId", vendorId);
  return search;
}

export async function listAttendanceEvents(
  scope: AttendanceScope,
  vendorId?: string,
) {
  const search = scopeParams(scope, vendorId);
  const res = await authFetch(`/api/ticket-attendance/events?${search}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading events.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<AttendanceListing[]>).data;
}

export async function listAttendanceAttractions(
  scope: AttendanceScope,
  vendorId?: string,
) {
  const search = scopeParams(scope, vendorId);
  const res = await authFetch(`/api/ticket-attendance/attractions?${search}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading attractions.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<AttendanceListing[]>).data;
}

export async function getEventAttendanceSummary(
  eventId: string,
  scope: AttendanceScope,
) {
  const search = scopeParams(scope);
  const res = await authFetch(
    `/api/ticket-attendance/events/${encodeURIComponent(eventId)}/summary?${search}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading attendance.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<AttendanceSummary>).data;
}

export async function listEventAttendanceScans(
  eventId: string,
  scope: AttendanceScope,
  params?: { cursor?: string; limit?: number },
) {
  const search = scopeParams(scope);
  if (params?.cursor) search.set("cursor", params.cursor);
  if (params?.limit) search.set("limit", String(params.limit));
  const res = await authFetch(
    `/api/ticket-attendance/events/${encodeURIComponent(eventId)}/scans?${search}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading scans.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (
    data as SuccessEnvelope<{ items: AttendanceScan[]; nextCursor?: string }>
  ).data;
}

export async function listAttendanceOccurrences(
  attractionId: string,
  scope: AttendanceScope,
  date?: string,
) {
  const search = scopeParams(scope);
  if (date) search.set("date", date);
  const res = await authFetch(
    `/api/ticket-attendance/attractions/${encodeURIComponent(attractionId)}/occurrences?${search}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading shows.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (
    data as SuccessEnvelope<{
      attractionId: string;
      date: string;
      timezone: string;
      items: AttendanceOccurrence[];
    }>
  ).data;
}

export async function getOccurrenceAttendanceSummary(
  attractionId: string,
  occurrenceId: string,
  scope: AttendanceScope,
) {
  const search = scopeParams(scope);
  const res = await authFetch(
    `/api/ticket-attendance/attractions/${encodeURIComponent(attractionId)}/occurrences/${encodeURIComponent(occurrenceId)}/summary?${search}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading attendance.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as SuccessEnvelope<AttendanceSummary>).data;
}

export async function listOccurrenceAttendanceScans(
  attractionId: string,
  occurrenceId: string,
  scope: AttendanceScope,
  params?: { cursor?: string; limit?: number },
) {
  const search = scopeParams(scope);
  if (params?.cursor) search.set("cursor", params.cursor);
  if (params?.limit) search.set("limit", String(params.limit));
  const res = await authFetch(
    `/api/ticket-attendance/attractions/${encodeURIComponent(attractionId)}/occurrences/${encodeURIComponent(occurrenceId)}/scans?${search}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading scans.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (
    data as SuccessEnvelope<{ items: AttendanceScan[]; nextCursor?: string }>
  ).data;
}
