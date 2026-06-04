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

export type SavedPaymentMethod = {
  id: string;
  stripePaymentMethodId: string;
  brand: string | null;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
};

type ApiListResponse = {
  success: boolean;
  data: SavedPaymentMethod[];
};

type ApiSetupIntentResponse = {
  success: boolean;
  data: { clientSecret: string };
};

export async function createSetupIntent() {
  const res = await authFetch("/api/payments/setup-intent", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    networkErrorMessage: "Network error while starting card setup.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiSetupIntentResponse).data;
}

export async function listPaymentMethods() {
  const res = await authFetch("/api/payments/methods", {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading payment methods.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiListResponse).data;
}

export async function setDefaultPaymentMethod(id: string) {
  const res = await authFetch(`/api/payments/methods/${encodeURIComponent(id)}/default`, {
    method: "PATCH",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while updating default card.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiListResponse).data;
}

export async function deletePaymentMethod(id: string) {
  const res = await authFetch(`/api/payments/methods/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while removing card.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as ApiListResponse).data;
}
