import { getPublicApiBaseUrl } from "@/lib/env";
import {
  isAccessTokenStillValid,
} from "@/features/auth/decode-access-token";

export type MediaAuthResult = {
  accessToken: string;
  /** When refresh rotated the session, forward this to the browser. */
  newRefreshToken: string | null;
};

type MediaAuthCache = {
  accessToken: string;
  refreshToken: string;
};

const REFRESH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

let authCache: MediaAuthCache | null = null;
let refreshInflight: Promise<MediaAuthResult | null> | null = null;

function parseRefreshTokenFromSetCookie(
  setCookie: string | string[] | null | undefined,
): string | null {
  if (!setCookie) return null;
  const parts = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const header of parts) {
    const match = header.match(/^refreshToken=([^;]+)/);
    if (match?.[1]) {
      return decodeURIComponent(match[1]);
    }
  }
  return null;
}

function cacheAuth(accessToken: string, refreshToken: string) {
  authCache = { accessToken, refreshToken };
}

function readCachedAuth(refreshToken: string): string | null {
  if (!authCache) return null;
  if (authCache.refreshToken !== refreshToken) return null;
  if (!isAccessTokenStillValid(authCache.accessToken)) return null;
  return authCache.accessToken;
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<MediaAuthResult | null> {
  const apiBase = getPublicApiBaseUrl();
  if (!apiBase) return null;

  const refreshRes = await fetch(`${apiBase}/api/auth/refresh`, {
    method: "POST",
    headers: { Cookie: `refreshToken=${refreshToken}` },
    cache: "no-store",
  });

  if (!refreshRes.ok) {
    authCache = null;
    return null;
  }

  const json = (await refreshRes.json()) as { accessToken?: string };
  if (typeof json.accessToken !== "string") {
    return null;
  }

  const setCookie =
    typeof refreshRes.headers.getSetCookie === "function"
      ? refreshRes.headers.getSetCookie()
      : refreshRes.headers.get("set-cookie");

  const rotatedRefresh =
    parseRefreshTokenFromSetCookie(setCookie) ?? refreshToken;

  cacheAuth(json.accessToken, rotatedRefresh);

  return {
    accessToken: json.accessToken,
    newRefreshToken: rotatedRefresh !== refreshToken ? rotatedRefresh : null,
  };
}

/**
 * Resolve a bearer token for /api/media proxy requests.
 * Uses a process-wide single-flight refresh so parallel <img> loads do not
 * rotate the same refresh token concurrently (which triggers reuse lockout).
 */
export async function resolveMediaAuth(
  refreshToken: string | undefined,
): Promise<MediaAuthResult | null> {
  if (!refreshToken) return null;

  const cached = readCachedAuth(refreshToken);
  if (cached) {
    return { accessToken: cached, newRefreshToken: null };
  }

  if (!refreshInflight) {
    refreshInflight = refreshAccessToken(refreshToken).finally(() => {
      refreshInflight = null;
    });
  }

  const result = await refreshInflight;
  return result;
}

function mediaCookieDomain(): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined;
  try {
    const apiBase = getPublicApiBaseUrl();
    // Derive parent domain from API host (api.myvenuebooking.com → .myvenuebooking.com)
    const hostname = new URL(apiBase || "https://api.myvenuebooking.com").hostname
      .replace(/^api\./i, "")
      .replace(/^www\./i, "");
    if (!hostname || hostname === "localhost") return undefined;
    return `.${hostname}`;
  } catch {
    return ".myvenuebooking.com";
  }
}

export function mediaRefreshCookieOptions() {
  const domain = mediaCookieDomain();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/api",
    maxAge: REFRESH_COOKIE_MAX_AGE_SECONDS,
    ...(domain ? { domain } : {}),
  };
}
