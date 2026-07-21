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
};

export type UpdateVerifierInput = {
  displayName?: string;
  password?: string;
  status?: VerifierStatus;
  eventIds?: string[];
};

export async function listVerifiers(params: {
  vendorProfileId?: string;
  search?: string;
} = {}) {
  const search = new URLSearchParams();
  if (params.vendorProfileId) search.set("vendorProfileId", params.vendorProfileId);
  if (params.search) search.set("search", params.search);
  const qs = search.toString();

  const res = await authFetch(`/api/verifiers${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading verifiers.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as ApiEnvelope<VerifierRow[]>).data;
}

export async function listAssignableEvents(vendorProfileId?: string) {
  const search = new URLSearchParams();
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

export async function createVerifier(input: CreateVerifierInput) {
  const res = await authFetch("/api/verifiers", {
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

export async function updateVerifier(id: string, input: UpdateVerifierInput) {
  const res = await authFetch(`/api/verifiers/${encodeURIComponent(id)}`, {
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

export async function deleteVerifier(id: string) {
  const res = await authFetch(`/api/verifiers/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deleting verifier.",
  });
  const data = await parseJson<unknown>(res);
  if (!res.ok) throw ApiError.fromUnknown(res.status, data);
  return (data as ApiEnvelope<{ id: string }>).data;
}
