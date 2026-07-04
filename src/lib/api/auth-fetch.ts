import { getAccessToken } from "@/features/auth/session-storage";import { refreshAndApplySession } from "@/features/auth/coordinated-refresh";
import { withLocaleHeaders } from "./locale-headers";
import { ApiError } from "./errors";
import { assertApiConfigured } from "@/lib/env";

type AuthFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  networkErrorMessage: string;
};

function buildHeaders(extra?: HeadersInit): Headers {
  const token = getAccessToken();
  if (!token) {
    throw new ApiError(401, "Please login to continue.");
  }

  const merged = withLocaleHeaders({ headers: extra });
  const headers = new Headers(merged.headers ?? undefined);
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function doFetch(path: string, options: AuthFetchOptions): Promise<Response> {
  const baseUrl = assertApiConfigured();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = buildHeaders(options.headers);
  try {
    return await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(0, options.networkErrorMessage);
  }
}

export async function authFetch(path: string, options: AuthFetchOptions): Promise<Response> {
  const firstResponse = await doFetch(path, options);
  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const refreshed = await refreshAndApplySession();
  if (!refreshed) {
    return firstResponse;
  }

  return doFetch(path, options);
}
