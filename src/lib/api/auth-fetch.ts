import { refreshAuthTokens } from "@/features/auth/api";
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAccessToken,
  updateRefreshToken,
} from "@/features/auth/session-storage";
import { ApiError } from "./errors";
import { assertApiConfigured } from "@/lib/env";

type AuthFetchOptions = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  networkErrorMessage: string;
};

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    return false;
  }

  try {
    const data = await refreshAuthTokens({ refreshToken });
    updateAccessToken(data.accessToken);
    updateRefreshToken(data.refreshToken);
    return true;
  } catch {
    clearAuthSession();
    return false;
  }
}

async function refreshAccessTokenShared(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function buildHeaders(extra?: HeadersInit): Headers {
  const token = getAccessToken();
  if (!token) {
    throw new ApiError(401, "Please login to continue.");
  }

  const headers = new Headers(extra ?? undefined);
  headers.set("Authorization", `Bearer ${token}`);
  return headers;
}

async function doFetch(path: string, options: AuthFetchOptions): Promise<Response> {
  const baseUrl = assertApiConfigured();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  // Build headers outside the fetch try/catch so auth errors (e.g. missing token)
  // are not misreported as network failures.
  const headers = buildHeaders(options.headers);
  try {
    return await fetch(url, {
      ...options,
      headers,
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

  const refreshed = await refreshAccessTokenShared();
  if (!refreshed) {
    return firstResponse;
  }

  return doFetch(path, options);
}
