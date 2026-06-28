import { NextResponse, type NextRequest } from "next/server";
import { getAuthRoleFromRequest } from "@/features/auth/auth-cookies";
import {
  getDefaultDashboardForRole,
  hasAnyRole,
  type AppRole,
} from "@/features/auth/roles";
import { getVendorRedirectForAdminPath } from "@/features/dashboard/admin-vendor-redirect";
import {
  buildLoginRedirectUrl,
  classifyRoute,
  sanitizeInternalRedirect,
  type RouteAccessRule,
} from "./route-config";

function redirect(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

function redirectToLogin(request: NextRequest): NextResponse {
  const loginUrl = buildLoginRedirectUrl(
    request.url,
    request.nextUrl.pathname,
    request.nextUrl.search,
  );
  return NextResponse.redirect(loginUrl);
}

function resolveWrongRoleRedirect(
  request: NextRequest,
  role: AppRole,
  rule: RouteAccessRule,
): NextResponse {
  if (rule.type === "admin" && role === "VENDOR") {
    const vendorTarget = getVendorRedirectForAdminPath(
      request.nextUrl.pathname,
      request.nextUrl.search,
    );
    if (vendorTarget) {
      const url = new URL(vendorTarget, request.url);
      return NextResponse.redirect(url);
    }
  }

  if (rule.type === "vendor" && role === "BUYER") {
    return redirect(request, getDefaultDashboardForRole("BUYER"));
  }

  if (rule.type === "authenticated" && role === "VENDOR") {
    return redirect(request, getDefaultDashboardForRole("VENDOR"));
  }

  if (rule.type === "admin" || rule.type === "vendor") {
    return redirect(request, getDefaultDashboardForRole(role));
  }

  return redirect(request, "/");
}

function resolveAuthenticatedAuthRouteRedirect(
  request: NextRequest,
  role: AppRole,
): NextResponse {
  const redirectParam = sanitizeInternalRedirect(
    request.nextUrl.searchParams.get("redirect"),
  );
  if (redirectParam) {
    const url = new URL(redirectParam, request.url);
    return NextResponse.redirect(url);
  }
  return redirect(request, getDefaultDashboardForRole(role));
}

export function resolveProxyAccess(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const rule = classifyRoute(pathname);
  const role = getAuthRoleFromRequest(request);
  const isAuthenticated = role !== null;

  if (rule.type === "public") {
    return NextResponse.next();
  }

  if (rule.type === "auth") {
    if (!isAuthenticated) {
      return NextResponse.next();
    }
    return resolveAuthenticatedAuthRouteRedirect(request, role);
  }

  if (!isAuthenticated) {
    return redirectToLogin(request);
  }

  const allowedRoles = rule.allowedRoles ?? [];
  if (!hasAnyRole(role, allowedRoles)) {
    return resolveWrongRoleRedirect(request, role, rule);
  }

  return NextResponse.next();
}
