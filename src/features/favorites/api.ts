import { ApiError } from "@/lib/api/errors";
import { authFetch } from "@/lib/api/auth-fetch";
import type {
  FavoriteIds,
  FavoritableType,
  FavoritesList,
  ToggleFavoriteResult,
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

export async function getFavoriteIds(): Promise<FavoriteIds> {
  const res = await authFetch("/api/favorites/ids", {
    method: "GET",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while loading favourites.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<FavoriteIds>).data;
}

export async function listFavorites(
  type: "all" | "event" | "venue" = "all",
): Promise<FavoritesList> {
  const res = await authFetch(
    `/api/favorites?type=${encodeURIComponent(type)}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      networkErrorMessage: "Network error while loading favourites.",
    },
  );

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<FavoritesList>).data;
}

export async function toggleFavorite(
  favoritableType: FavoritableType,
  favoritableId: string,
): Promise<ToggleFavoriteResult> {
  const res = await authFetch("/api/favorites/toggle", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ favoritableType, favoritableId }),
    networkErrorMessage: "Network error while updating favourite.",
  });

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }

  return (data as SuccessEnvelope<ToggleFavoriteResult>).data;
}
