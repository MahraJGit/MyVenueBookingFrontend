import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import type {
  NotificationItem,
  NotificationPreferences,
} from "./types";

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

export type NotificationAudience = "USER" | "VENDOR" | "ADMIN";

function audienceQuery(audience?: NotificationAudience) {
  return audience ? `audience=${encodeURIComponent(audience)}` : "";
}

export async function listNotifications(
  filter: "all" | "read" | "unread" = "all",
  audience?: NotificationAudience,
) {
  const params = [`filter=${encodeURIComponent(filter)}`, audienceQuery(audience)]
    .filter(Boolean)
    .join("&");
  const res = await authFetch(`/api/notifications?${params}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading notifications.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<NotificationItem[]>).data;
}

export async function getUnreadNotificationCount(
  audience?: NotificationAudience,
) {
  const suffix = audienceQuery(audience);
  const res = await authFetch(
    `/api/notifications/unread-count${suffix ? `?${suffix}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading notification count.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<{ count: number }>).data.count;
}

export async function markNotificationRead(id: string) {
  const res = await authFetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
    method: "PATCH",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while updating notification.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }
}

export async function markAllNotificationsRead(
  audience?: NotificationAudience,
) {
  const suffix = audienceQuery(audience);
  const res = await authFetch(
    `/api/notifications/read-all${suffix ? `?${suffix}` : ""}`,
    {
      method: "PATCH",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while updating notifications.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }
}

export async function getNotificationPreferences() {
  const res = await authFetch("/api/notifications/preferences", {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading notification settings.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<NotificationPreferences>).data;
}

export async function updateNotificationPreferences(
  body: Partial<NotificationPreferences>,
) {
  const res = await authFetch("/api/notifications/preferences", {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while saving notification settings.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<NotificationPreferences>).data;
}
