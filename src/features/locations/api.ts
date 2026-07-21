import { ApiError } from "@/lib/api/errors";
import { apiGet } from "@/lib/api/client";
import { authFetch } from "@/lib/api/auth-fetch";
import type { City, CityPayload, Country, CountryPayload } from "./types";

type SuccessEnvelope<T> = {
  status?: string;
  message?: string;
  data: T;
};

function unwrapEnvelope<T>(json: SuccessEnvelope<T>): T {
  return json.data;
}

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, "Invalid response from server");
  }
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

export async function listCountries(params?: { activeOnly?: boolean }): Promise<Country[]> {
  const sp = new URLSearchParams();
  if (params?.activeOnly) sp.set("activeOnly", "true");
  const query = sp.toString();
  const json = await apiGet<SuccessEnvelope<Country[]>>(
    `/api/locations/countries${query ? `?${query}` : ""}`,
  );
  return unwrapEnvelope(json);
}

export async function listCitiesByCountryCode(
  countryCode: string,
  params?: { activeOnly?: boolean; featuredOnly?: boolean },
): Promise<City[]> {
  const normalizedCode = countryCode.trim().toUpperCase();
  const sp = new URLSearchParams();
  if (params?.activeOnly) sp.set("activeOnly", "true");
  if (params?.featuredOnly) sp.set("featuredOnly", "true");
  const query = sp.toString();
  const json = await apiGet<SuccessEnvelope<City[]>>(
    `/api/locations/countries/${encodeURIComponent(normalizedCode)}/cities${query ? `?${query}` : ""}`,
  );
  return unwrapEnvelope(json);
}

export async function saveCountry(payload: CountryPayload): Promise<Country> {
  return authJson<Country>("/api/locations/countries", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    networkErrorMessage: "Network error while saving country.",
  });
}

export async function updateCountry(id: string, payload: Partial<CountryPayload>): Promise<Country> {
  return authJson<Country>(`/api/locations/countries/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    networkErrorMessage: "Network error while updating country.",
  });
}

export async function createCity(payload: CityPayload): Promise<City> {
  return authJson<City>("/api/locations/cities", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    networkErrorMessage: "Network error while creating city.",
  });
}

export async function deleteCity(cityId: string): Promise<void> {
  return authVoid(`/api/locations/cities/${encodeURIComponent(cityId)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    networkErrorMessage: "Network error while deleting city.",
  });
}
