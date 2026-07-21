"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  ADMIN_DASHBOARD_PREFIX,
  VENDOR_DASHBOARD_PREFIX,
} from "@/features/dashboard/admin-vendor-redirect";

export { ADMIN_DASHBOARD_PREFIX, VENDOR_DASHBOARD_PREFIX, getVendorRedirectForAdminPath } from "@/features/dashboard/admin-vendor-redirect";
export type DashboardScope = "admin" | "vendor";

export type DashboardPaths = {
  scope: DashboardScope;
  root: string;
  events: string;
  addEvent: string;
  editEvent: (id: string) => string;
  tickets: string;
  verifiers: string;
  analytics: string;
  venues: string;
  myVenues: string;
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
      verifiers: `${VENDOR_DASHBOARD_PREFIX}/verifiers`,
      analytics: `${VENDOR_DASHBOARD_PREFIX}/analytics`,
    venues: `${VENDOR_DASHBOARD_PREFIX}/venues`,
    myVenues: `${VENDOR_DASHBOARD_PREFIX}/venues`,
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
    verifiers: `${ADMIN_DASHBOARD_PREFIX}/verifiers`,
    analytics: `${ADMIN_DASHBOARD_PREFIX}/analytics`,
    venues: `${ADMIN_DASHBOARD_PREFIX}/manageVenues`,
    myVenues: `${ADMIN_DASHBOARD_PREFIX}/myVenues`,
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
