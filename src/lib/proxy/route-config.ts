import type { AppRole } from "@/features/auth/roles";
import {
  ADMIN_DASHBOARD_PREFIX,
  VENDOR_DASHBOARD_PREFIX,
} from "@/features/dashboard/admin-vendor-redirect";

export type RouteAccessType =
  | "public"
  | "auth"
  | "authenticated"
  | "vendor"
  | "admin";

export type RouteAccessRule = {
  type: RouteAccessType;
  /** Required when type is authenticated, vendor, or admin. */
  allowedRoles?: readonly AppRole[];
};

export const USER_DASHBOARD_PREFIX = "/userDashboard";

const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/signup",
  "/verify-otp",
  "/forgot-password",
  "/reset-password",
  "/auth/oauth/callback",
  "/auth/link-account",
] as const;

const BOOKING_CHECKOUT_PATTERN = /^\/venues\/booking\/[^/]+\/checkout\/?$/;

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isBookingCheckoutRoute(pathname: string): boolean {
  return BOOKING_CHECKOUT_PATTERN.test(pathname);
}

export function classifyRoute(pathname: string): RouteAccessRule {
  if (pathname.startsWith(ADMIN_DASHBOARD_PREFIX)) {
    return { type: "admin", allowedRoles: ["ADMIN"] };
  }

  if (pathname.startsWith(VENDOR_DASHBOARD_PREFIX)) {
    return { type: "vendor", allowedRoles: ["VENDOR", "ADMIN"] };
  }

  if (pathname.startsWith(USER_DASHBOARD_PREFIX)) {
    return {
      type: "authenticated",
      allowedRoles: ["BUYER", "VENDOR", "ADMIN"],
    };
  }

  if (isBookingCheckoutRoute(pathname)) {
    return { type: "authenticated", allowedRoles: ["BUYER", "ADMIN"] };
  }

  if (isAuthRoute(pathname)) {
    return { type: "auth" };
  }

  return { type: "public" };
}

export function isProtectedRoute(pathname: string): boolean {
  const rule = classifyRoute(pathname);
  return rule.type !== "public" && rule.type !== "auth";
}

export function buildLoginRedirectUrl(
  requestUrl: string,
  pathname: string,
  search = "",
): URL {
  const loginUrl = new URL("/login", requestUrl);
  const destination = `${pathname}${search}`;
  if (destination && destination !== "/") {
    loginUrl.searchParams.set("redirect", destination);
  }
  return loginUrl;
}

export function sanitizeInternalRedirect(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}
