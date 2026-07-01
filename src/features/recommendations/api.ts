import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import type { PublicEvent } from "@/features/events/api";
import type { PublicVenue } from "@/features/venues/types";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

type SuccessEnvelope<T> = { success: boolean; data: T };

export async function getRecommendedEvents(
  limit = 8,
): Promise<PublicEvent[]> {
  const res = await authFetch(
    `/api/recommendations/events?limit=${encodeURIComponent(String(limit))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading recommendations.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<PublicEvent[]>).data;
}

export async function getRecommendedVenues(
  limit = 8,
): Promise<PublicVenue[]> {
  const res = await authFetch(
    `/api/recommendations/venues?limit=${encodeURIComponent(String(limit))}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading recommendations.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<PublicVenue[]>).data;
}
