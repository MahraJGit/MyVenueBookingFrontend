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

export type AttractionCategory = {
  id: string;
  name: string;
  originalName?: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AttractionCategoryOption = {
  label: string;
  value: string;
};

export type CreateAttractionCategoryBody = {
  name: string;
  description?: string | null;
  isActive?: boolean;
};

export type UpdateAttractionCategoryBody = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export function toAttractionCategoryOption(
  category: AttractionCategory,
): AttractionCategoryOption {
  return {
    label: category.name,
    value: category.originalName?.trim() || category.name,
  };
}

export async function listAttractionCategories(params?: {
  search?: string;
  isActive?: boolean;
}): Promise<AttractionCategory[]> {
  const sp = new URLSearchParams();
  if (params?.search?.trim()) sp.set("search", params.search.trim());
  if (params?.isActive !== undefined) {
    sp.set("isActive", params.isActive ? "true" : "false");
  }
  const qs = sp.toString();
  const path = qs
    ? `/api/attraction-categories?${qs}`
    : "/api/attraction-categories";

  const json = await apiGet<SuccessEnvelope<AttractionCategory[]>>(path);
  return unwrapEnvelope(json);
}

export async function listPublicAttractionCategories(): Promise<
  AttractionCategory[]
> {
  return listAttractionCategories({ isActive: true });
}

export async function getAttractionCategory(
  id: string,
): Promise<AttractionCategory> {
  const res = await authFetch(
    `/api/attraction-categories/${encodeURIComponent(id)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading attraction category.",
    },
  );

  const json = await parseJson<SuccessEnvelope<AttractionCategory>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function createAttractionCategory(
  body: CreateAttractionCategoryBody,
): Promise<AttractionCategory> {
  const res = await authFetch("/api/attraction-categories", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    networkErrorMessage: "Network error while creating attraction category.",
  });

  const json = await parseJson<SuccessEnvelope<AttractionCategory>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function updateAttractionCategory(
  id: string,
  body: UpdateAttractionCategoryBody,
): Promise<AttractionCategory> {
  const res = await authFetch(
    `/api/attraction-categories/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      networkErrorMessage: "Network error while updating attraction category.",
    },
  );

  const json = await parseJson<SuccessEnvelope<AttractionCategory>>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, json as unknown);
  }
  return unwrapEnvelope(json);
}

export async function deleteAttractionCategory(id: string): Promise<void> {
  const res = await authFetch(
    `/api/attraction-categories/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while deleting attraction category.",
    },
  );

  if (!res.ok) {
    const json = await parseJson<unknown>(res);
    throw ApiError.fromUnknown(res.status, json);
  }
}
