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

type ApiEnvelope<T> = { success: boolean; data: T };

export type VerifierStatus = "ACTIVE" | "DISABLED";

export type VerifierEvent = {
  id: string;
  eventName: string;
  slug: string;
  startDateTime: string;
  timezone?: string;
  status: string;
};

export type VerifierAttraction = {
  id: string;
  name: string;
  slug: string;
  scheduleStartDate: string;
  timezone?: string;
  status: string;
  city?: string;
};

export type VerifierRow = {
  id: string;
  username: string;
  displayName: string;
  status: VerifierStatus;
  vendorProfileId: string;
  vendorName: string;
  createdAt: string;
  updatedAt: string;
  events: VerifierEvent[];
  attractions: VerifierAttraction[];
};

export type AssignableEvent = {
  id: string;
  eventName: string;
  slug: string;
  startDateTime: string;
  endDateTime: string;
  timezone?: string;
  status: string;
  city: string;
};

export type AssignableAttraction = {
  id: string;
  name: string;
  slug: string;
  scheduleStartDate: string;
  scheduleEndDate: string | null;
  timezone?: string;
  status: string;
  city: string;
};

export type VerifierVendorOption = {
  id: string;
  vendorName: string;
};

export type CreateVerifierInput = {
  username: string;
  password: string;
  displayName: string;
  vendorProfileId?: string;
  eventIds: string[];
  attractionIds: string[];
};

export type UpdateVerifierInput = {
  displayName?: string;
  password?: string;
  status?: VerifierStatus;
  eventIds?: string[];
  attractionIds?: string[];
};

export async function listVerifiers(params: {
  scope?: "workspace" | "platform";
  vendorProfileId?: string;
  search?: string;
  status?: VerifierStatus;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "username" | "displayName";
  sortOrder?: "asc" | "desc";
} = {}) {
  const search = new URLSearchParams();
  if (params.scope) search.set("scope", params.scope);
  if (params.vendorProfileId) search.set("vendorProfileId", params.vendorProfileId);
  if (params.search) search.set("search", params.search);
  if (params.status) search.set("status", params.status);
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.sortBy) search.set("sortBy", params.sortBy);
  if (params.sortOrder) search.set("sortOrder", params.sortOrder);
  const qs = search.toString();

  const res = await authFetch(`/api/verifiers${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading verifiers.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  const envelope = data as ApiEnvelope<VerifierRow[]> & {
    meta?: { total: number; page: number; limit: number; totalPages: number };
  };
  return {
    data: envelope.data,
    meta: envelope.meta ?? {
      total: envelope.data.length,
      page: params.page ?? 1,
      limit: params.limit ?? envelope.data.length,
      totalPages: 1,
    },
  };
}

export async function listAssignableEvents(
  vendorProfileId?: string,
  scope: "workspace" | "platform" = "workspace",
) {
  const search = new URLSearchParams();
  search.set("scope", scope);
  if (vendorProfileId) search.set("vendorProfileId", vendorProfileId);
  const qs = search.toString();

  const res = await authFetch(
    `/api/verifiers/assignable-events${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading events.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as ApiEnvelope<AssignableEvent[]>).data;
}

export async function listAssignableAttractions(
  vendorProfileId?: string,
  scope: "workspace" | "platform" = "workspace",
) {
  const search = new URLSearchParams();
  search.set("scope", scope);
  if (vendorProfileId) search.set("vendorProfileId", vendorProfileId);
  const qs = search.toString();

  const res = await authFetch(
    `/api/verifiers/assignable-attractions${qs ? `?${qs}` : ""}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading attractions.",
    },
  );
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as ApiEnvelope<AssignableAttraction[]>).data;
}

export async function listVerifierVendors() {
  const res = await authFetch("/api/verifiers/vendors", {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading vendors.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as ApiEnvelope<VerifierVendorOption[]>).data;
}

export async function createVerifier(
  input: CreateVerifierInput,
  scope: "workspace" | "platform" = "workspace",
) {
  const res = await authFetch(`/api/verifiers?scope=${scope}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    networkErrorMessage: "Network error while creating verifier.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as ApiEnvelope<VerifierRow>).data;
}

export async function updateVerifier(
  id: string,
  input: UpdateVerifierInput,
  scope: "workspace" | "platform" = "workspace",
) {
  const res = await authFetch(`/api/verifiers/${encodeURIComponent(id)}?scope=${scope}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    networkErrorMessage: "Network error while updating verifier.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as ApiEnvelope<VerifierRow>).data;
}

export async function deleteVerifier(
  id: string,
  scope: "workspace" | "platform" = "workspace",
) {
  const res = await authFetch(`/api/verifiers/${encodeURIComponent(id)}?scope=${scope}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deleting verifier.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as ApiEnvelope<{ id: string }>).data;
}
