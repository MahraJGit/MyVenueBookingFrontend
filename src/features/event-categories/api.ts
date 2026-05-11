import { ApiError } from "@/lib/api/errors";
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

export type EventCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateEventCategoryBody = {
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateEventCategoryBody = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export async function listEventCategories(params?: {
  search?: string;
  isActive?: boolean;
}): Promise<EventCategory[]> {
  const sp = new URLSearchParams();
  if (params?.search?.trim()) sp.set("search", params.search.trim());
  if (params?.isActive !== undefined) {
    sp.set("isActive", params.isActive ? "true" : "false");
  }
  const qs = sp.toString();
  const path = qs ? `/api/event-categories?${qs}` : "/api/event-categories";

  const res = await authFetch(path, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading event categories.",
  });

  const json = await parseJson<SuccessEnvelope<EventCategory[]>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function getEventCategory(id: string): Promise<EventCategory> {
  const res = await authFetch(
    `/api/event-categories/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading event category.",
    },
  );

  const json = await parseJson<SuccessEnvelope<EventCategory>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function createEventCategory(
  body: CreateEventCategoryBody,
): Promise<EventCategory> {
  const res = await authFetch("/api/event-categories", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating event category.",
  });

  const json = await parseJson<SuccessEnvelope<EventCategory>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function updateEventCategory(
  id: string,
  body: UpdateEventCategoryBody,
): Promise<EventCategory> {
  const res = await authFetch(
    `/api/event-categories/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating event category.",
    },
  );

  const json = await parseJson<SuccessEnvelope<EventCategory>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function deleteEventCategory(id: string): Promise<void> {
  const res = await authFetch(
    `/api/event-categories/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while deleting event category.",
    },
  );

  if (!res.ok) {
    const json = await parseJson<unknown>(res);
    throw ApiError.fromUnknown(res.status, json);
  }
}
