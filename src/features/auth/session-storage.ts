import type { AuthUser } from "./types";

const ACCESS = "mvb_access_token";
const USER = "mvb_user_json";

/** Persist access token + user snapshot (sessionStorage). Refresh token stays HttpOnly cookie only. */
export function persistAuthSession(session: { accessToken: string; user: AuthUser }) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS, session.accessToken);
  sessionStorage.setItem(USER, JSON.stringify(session.user));
  sessionStorage.removeItem("mvb_refresh_token");
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(USER);
  sessionStorage.removeItem("mvb_refresh_token");
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(ACCESS);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function updateAccessToken(accessToken: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ACCESS, accessToken);
}
