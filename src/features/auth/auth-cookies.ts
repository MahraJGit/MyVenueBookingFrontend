import type { NextRequest } from "next/server";
import { isAppRole, type AppRole } from "./roles";

/** Readable cookie used by proxy for optimistic auth/role checks. */
export const AUTH_ROLE_COOKIE = "mvb_auth_role";

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function buildAuthCookieOptions(maxAge = AUTH_COOKIE_MAX_AGE_SECONDS): string {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? ";Secure"
      : "";
  return `path=/;max-age=${maxAge};SameSite=Lax${secure}`;
}

/** Client-side: read mirrored role cookie (hint only — not a security boundary). */
export function getAuthRoleFromDocument(): AppRole | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${AUTH_ROLE_COOKIE}=`));
  if (!match) return null;
  const raw = decodeURIComponent(match.slice(AUTH_ROLE_COOKIE.length + 1));
  return isAppRole(raw) ? raw : null;
}

/** Client-side: mirror session role into a cookie the proxy can read. */
export function setAuthRoleCookie(role: AppRole) {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_ROLE_COOKIE}=${encodeURIComponent(role)};${buildAuthCookieOptions()}`;
}

/** Client-side: remove auth role cookie on logout or session clear. */
export function clearAuthRoleCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_ROLE_COOKIE}=;${buildAuthCookieOptions(0)}`;
}

/** Server-side (proxy): read authenticated role from request cookies. */
export function getAuthRoleFromRequest(request: NextRequest): AppRole | null {
  const raw = request.cookies.get(AUTH_ROLE_COOKIE)?.value;
  if (!raw) return null;
  const role = decodeURIComponent(raw);
  return isAppRole(role) ? role : null;
}

export function isAuthenticatedRequest(request: NextRequest): boolean {
  return getAuthRoleFromRequest(request) !== null;
}
