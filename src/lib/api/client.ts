import { assertApiConfigured } from "@/lib/env";
import { ApiError } from "./errors";

async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(res.status, "Invalid response from server");
  }
}

export async function apiGet<TResponse>(
  path: string,
  init?: Omit<RequestInit, "method">,
): Promise<TResponse> {
  const baseUrl = assertApiConfigured();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const { headers: incoming, ...rest } = init ?? {};
  const headers = new Headers(incoming ?? undefined);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: "GET",
      headers,
      ...rest,
    });
  } catch {
    throw new ApiError(
      0,
      "Network error. Check that the API is running and NEXT_PUBLIC_API_BASE_URL is correct.",
    );
  }

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }
  return data as TResponse;
}

export async function apiPost<TResponse, TBody extends object>(
  path: string,
  body: TBody,
  init?: Omit<RequestInit, "method" | "body">,
): Promise<TResponse> {
  const baseUrl = assertApiConfigured();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const { headers: incoming, ...rest } = init ?? {};
  const headers = new Headers(incoming ?? undefined);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  headers.set("Content-Type", "application/json");

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      ...rest,
    });
  } catch {
    throw new ApiError(
      0,
      "Network error. Check that the API is running and NEXT_PUBLIC_API_BASE_URL is correct.",
    );
  }

  const data = await parseJson<unknown>(res);
  if (!res.ok) {
    throw ApiError.fromUnknown(res.status, data);
  }
  return data as TResponse;
}
