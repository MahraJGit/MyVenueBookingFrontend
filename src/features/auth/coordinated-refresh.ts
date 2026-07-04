import { refreshAuthTokens } from "@/features/auth/api";
import type { RefreshTokensResponse } from "@/features/auth/types";
import {
  decodeAccessTokenPayload,
  isAccessTokenStillValid,
} from "@/features/auth/decode-access-token";
import { ApiError } from "@/lib/api/errors";
import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
  hasPersistedAuthSession,
  notifyAuthSessionExpired,
  patchAuthUser,
  persistAuthSession,
  updateAccessToken,
} from "@/features/auth/session-storage";

const REFRESH_LOCK = "mvb-auth-refresh";

/** Thrown for non-auth failures so callers can avoid logging the user out. */
export class TransientRefreshError extends Error {
  constructor(message = "Token refresh temporarily unavailable") {
    super(message);
    this.name = "TransientRefreshError";
  }
}

let inTabRefresh: Promise<RefreshTokensResponse | null> | null = null;

function isDefinitiveAuthFailure(error: unknown): boolean {
  return error instanceof ApiError && error.statusCode === 401;
}

async function runRefresh(): Promise<RefreshTokensResponse | null> {
  const request = async () => {
    try {
      return await refreshAuthTokens();
    } catch (error) {
      if (isDefinitiveAuthFailure(error)) {
        return null;
      }
      throw new TransientRefreshError(
        error instanceof Error ? error.message : "Token refresh failed",
      );
    }
  };

  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(REFRESH_LOCK, request);
  }
  return request();
}

/**
 * Single-flight refresh across concurrent callers in this tab, and across tabs
 * when Web Locks are available. Returns null only on definitive auth failure (401).
 * Throws TransientRefreshError for network / rate-limit / 5xx issues.
 */
export async function coordinatedRefreshTokens(): Promise<RefreshTokensResponse | null> {
  if (!inTabRefresh) {
    inTabRefresh = runRefresh().finally(() => {
      inTabRefresh = null;
    });
  }
  return inTabRefresh;
}

export function applyRefreshedAccessToken(accessToken: string): boolean {
  const claims = decodeAccessTokenPayload(accessToken);
  if (!claims) return false;

  const existing = getAuthUser();
  if (!existing) {
    persistAuthSession({
      accessToken,
      user: { id: claims.id, email: "", role: claims.role },
    });
    return true;
  }

  updateAccessToken(accessToken);
  if (existing.id !== claims.id || existing.role !== claims.role) {
    patchAuthUser({ id: claims.id, role: claims.role });
  }
  return true;
}

function hasUsableLocalSession(): boolean {
  const accessToken = getAccessToken();
  return Boolean(
    accessToken && getAuthUser() && isAccessTokenStillValid(accessToken),
  );
}

function expireSession(): false {
  clearAuthSession();
  notifyAuthSessionExpired();
  return false;
}

/**
 * Refresh access token via HttpOnly cookie.
 * - Returns true when a usable access token is available afterwards.
 * - Clears the session only on definitive auth failure (invalid/expired refresh).
 * - Leaves the session intact on transient failures (network, 429, 5xx).
 */
export async function refreshAndApplySession(): Promise<boolean> {
  if (hasUsableLocalSession()) {
    return true;
  }

  try {
    const data = await coordinatedRefreshTokens();
    if (!data) {
      return expireSession();
    }
    return applyRefreshedAccessToken(data.accessToken);
  } catch (error) {
    if (error instanceof TransientRefreshError) {
      // Keep any existing snapshot so the user is not logged out on blips / rate limits.
      return hasUsableLocalSession() || hasPersistedAuthSession();
    }
    return expireSession();
  }
}
