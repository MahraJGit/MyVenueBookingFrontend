import type { AuthUser } from "./types";
import { clearAuthRoleCookie, setAuthRoleCookie } from "./auth-cookies";
import { isAppRole } from "./roles";

const ACCESS = "mvb_access_token";
const USER = "mvb_user_json";
const LEGACY_REFRESH = "mvb_refresh_token";

export const AUTH_CHANGED_EVENT = "mvb-auth-changed";
export const AUTH_SESSION_EXPIRED_EVENT = "mvb-auth-session-expired";

function authStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

/** One-time migration from tab-scoped sessionStorage → shared localStorage. */
function migrateLegacySessionStorage() {
  if (typeof window === "undefined") return;
  try {
    const legacyAccess = sessionStorage.getItem(ACCESS);
    const legacyUser = sessionStorage.getItem(USER);
    if (legacyAccess && legacyUser && !localStorage.getItem(ACCESS)) {
      localStorage.setItem(ACCESS, legacyAccess);
      localStorage.setItem(USER, legacyUser);
    }
    sessionStorage.removeItem(ACCESS);
    sessionStorage.removeItem(USER);
    sessionStorage.removeItem(LEGACY_REFRESH);
  } catch {
    // Private mode / blocked storage — ignore.
  }
}

let didMigrate = false;

function ensureMigrated() {
  if (didMigrate) return;
  didMigrate = true;
  migrateLegacySessionStorage();
}

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function notifyAuthSessionExpired() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

/**
 * Persist access token + user snapshot in localStorage so all tabs share auth state.
 * Refresh token stays HttpOnly cookie only (never written to web storage).
 */
export function persistAuthSession(session: { accessToken: string; user: AuthUser }) {
  const storage = authStorage();
  if (!storage) return;
  ensureMigrated();
  storage.setItem(ACCESS, session.accessToken);
  storage.setItem(USER, JSON.stringify(session.user));
  storage.removeItem(LEGACY_REFRESH);
  if (isAppRole(session.user.role)) {
    setAuthRoleCookie(session.user.role);
  }
  notifyAuthChanged();
}

export function clearAuthSession() {
  const storage = authStorage();
  if (!storage) return;
  ensureMigrated();
  storage.removeItem(ACCESS);
  storage.removeItem(USER);
  storage.removeItem(LEGACY_REFRESH);
  try {
    sessionStorage.removeItem(ACCESS);
    sessionStorage.removeItem(USER);
    sessionStorage.removeItem(LEGACY_REFRESH);
  } catch {
    // ignore
  }
  clearAuthRoleCookie();
  notifyAuthChanged();
}

export function getAccessToken(): string | null {
  const storage = authStorage();
  if (!storage) return null;
  ensureMigrated();
  return storage.getItem(ACCESS);
}

export function getAuthUser(): AuthUser | null {
  const storage = authStorage();
  if (!storage) return null;
  ensureMigrated();
  const raw = storage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function updateAccessToken(accessToken: string) {
  const storage = authStorage();
  if (!storage) return;
  ensureMigrated();
  storage.setItem(ACCESS, accessToken);
  notifyAuthChanged();
}

export function patchAuthUser(partial: Partial<AuthUser>) {
  const storage = authStorage();
  if (!storage) return;
  ensureMigrated();
  const user = getAuthUser();
  if (!user) return;
  const nextUser = { ...user, ...partial };
  storage.setItem(USER, JSON.stringify(nextUser));
  if (isAppRole(nextUser.role)) {
    setAuthRoleCookie(nextUser.role);
  }
  notifyAuthChanged();
}

export function hasPersistedAuthSession(): boolean {
  return Boolean(getAccessToken() && getAuthUser());
}
