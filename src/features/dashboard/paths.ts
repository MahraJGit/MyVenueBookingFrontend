"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

export const ADMIN_DASHBOARD_PREFIX = "/adminDashbaord";
export const VENDOR_DASHBOARD_PREFIX = "/vendorDashboard";

export type DashboardScope = "admin" | "vendor";

export type DashboardPaths = {
  scope: DashboardScope;
  root: string;
  events: string;
  addEvent: string;
  editEvent: (id: string) => string;
  tickets: string;
  analytics: string;
  venues: string;
  addVenue: string;
  editVenue: (id: string) => string;
  venueBookings: string;
  eventCategories: string;
};

export function getDashboardPaths(scope: DashboardScope): DashboardPaths {
  if (scope === "vendor") {
    return {
      scope: "vendor",
      root: VENDOR_DASHBOARD_PREFIX,
      events: `${VENDOR_DASHBOARD_PREFIX}/events`,
      addEvent: `${VENDOR_DASHBOARD_PREFIX}/events/new`,
      editEvent: (id: string) =>
        `${VENDOR_DASHBOARD_PREFIX}/events/new?id=${encodeURIComponent(id)}`,
      tickets: `${VENDOR_DASHBOARD_PREFIX}/tickets`,
      analytics: `${VENDOR_DASHBOARD_PREFIX}/analytics`,
    venues: `${VENDOR_DASHBOARD_PREFIX}/venues`,
    addVenue: `${VENDOR_DASHBOARD_PREFIX}/venues/new`,
    editVenue: (id: string) =>
      `${VENDOR_DASHBOARD_PREFIX}/venues/new?id=${encodeURIComponent(id)}`,
    venueBookings: `${VENDOR_DASHBOARD_PREFIX}/bookings`,
      eventCategories: `${ADMIN_DASHBOARD_PREFIX}/events`,
    };
  }

  return {
    scope: "admin",
    root: `${ADMIN_DASHBOARD_PREFIX}/dashboard`,
    events: `${ADMIN_DASHBOARD_PREFIX}/manageEvents`,
    addEvent: `${ADMIN_DASHBOARD_PREFIX}/addEvents`,
    editEvent: (id: string) =>
      `${ADMIN_DASHBOARD_PREFIX}/addEvents?id=${encodeURIComponent(id)}`,
    tickets: `${ADMIN_DASHBOARD_PREFIX}/manageTickets`,
    analytics: `${ADMIN_DASHBOARD_PREFIX}/analytics`,
    venues: `${ADMIN_DASHBOARD_PREFIX}/manageVenues`,
    addVenue: `${ADMIN_DASHBOARD_PREFIX}/venues/new`,
    editVenue: (id: string) =>
      `${ADMIN_DASHBOARD_PREFIX}/venues/new?id=${encodeURIComponent(id)}`,
    venueBookings: `${ADMIN_DASHBOARD_PREFIX}/venueBookings`,
    eventCategories: `${ADMIN_DASHBOARD_PREFIX}/events`,
  };
}

export function resolveDashboardScope(pathname: string): DashboardScope {
  return pathname.startsWith(VENDOR_DASHBOARD_PREFIX) ? "vendor" : "admin";
}

export function useDashboardPaths(): DashboardPaths {
  const pathname = usePathname();
  const scope = resolveDashboardScope(pathname);
  return useMemo(() => getDashboardPaths(scope), [scope]);
}

/** Map legacy admin dashboard URLs to vendor dashboard equivalents. */
export function getVendorRedirectForAdminPath(
  pathname: string,
  search: string,
): string | null {
  if (!pathname.startsWith(ADMIN_DASHBOARD_PREFIX)) return null;

  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/manageEvents`) {
    return `${VENDOR_DASHBOARD_PREFIX}/events`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/addEvents`) {
    return `${VENDOR_DASHBOARD_PREFIX}/events/new${search}`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/manageTickets`) {
    return `${VENDOR_DASHBOARD_PREFIX}/tickets`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/analytics`) {
    return `${VENDOR_DASHBOARD_PREFIX}/analytics`;
  }
  if (
    pathname === `${ADMIN_DASHBOARD_PREFIX}/dashboard` ||
    pathname === ADMIN_DASHBOARD_PREFIX
  ) {
    return VENDOR_DASHBOARD_PREFIX;
  }

  return VENDOR_DASHBOARD_PREFIX;
}
