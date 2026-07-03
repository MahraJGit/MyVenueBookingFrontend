import { refreshAuthTokens } from "@/features/auth/api";
import type { RefreshTokensResponse } from "@/features/auth/types";
import {
  decodeAccessTokenPayload,
  isAccessTokenStillValid,
} from "@/features/auth/decode-access-token";
import {
  clearAuthSession,
  getAccessToken,
  getAuthUser,
  notifyAuthSessionExpired,
  patchAuthUser,
  persistAuthSession,
  updateAccessToken,
} from "@/features/auth/session-storage";

const REFRESH_LOCK = "mvb-auth-refresh";

let inTabRefresh: Promise<RefreshTokensResponse | null> | null = null;

async function runRefresh(): Promise<RefreshTokensResponse | null> {
  try {
    const request = () => refreshAuthTokens();
    if (typeof navigator !== "undefined" && navigator.locks?.request) {
      return await navigator.locks.request(REFRESH_LOCK, request);
    }
    return await request();
  } catch {
    return null;
  }
}

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
  return Boolean(accessToken && getAuthUser() && isAccessTokenStillValid(accessToken));
}

export async function refreshAndApplySession(): Promise<boolean> {
  const data = await coordinatedRefreshTokens();
  if (!data) {
    if (hasUsableLocalSession()) {
      return true;
    }
    clearAuthSession();
    notifyAuthSessionExpired();
    return false;
  }
  return applyRefreshedAccessToken(data.accessToken);
}
