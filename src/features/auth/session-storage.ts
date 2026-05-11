import type { AuthUser } from "./types";

const ACCESS = "mvb_access_token";
const REFRESH = "mvb_refresh_token";
const USER = "mvb_user_json";

/** Persist JWT + user snapshot (sessionStorage = tab lifecycle). */
export function persistAuthSession(tokens: {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS, tokens.accessToken);
  sessionStorage.setItem(REFRESH, tokens.refreshToken);
  sessionStorage.setItem(USER, JSON.stringify(tokens.user));
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(REFRESH);
  sessionStorage.removeItem(USER);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFRESH);
}

export function updateAccessToken(accessToken: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS, accessToken);
}

export function updateRefreshToken(refreshToken: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(REFRESH, refreshToken);
}
