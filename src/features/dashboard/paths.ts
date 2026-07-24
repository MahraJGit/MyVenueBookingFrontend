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
  manageEventSeating: (id: string) => string;
  manageEventQuantity: (id: string) => string;
  attractions: string;
  addAttraction: string;
  editAttraction: (id: string) => string;
  manageAttractionOccurrences: (id: string) => string;
  manageAttractionOccurrenceSeating: (
    attractionId: string,
    occurrenceId: string,
  ) => string;
  tickets: string;
  attractionTickets: string;
  verifiers: string;
  analytics: string;
  venues: string;
  myVenues: string;
  addVenue: string;
  editVenue: (id: string) => string;
  manageVenueSchedule: (id: string) => string;
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
      manageEventSeating: (id: string) =>
        `${VENDOR_DASHBOARD_PREFIX}/events/${encodeURIComponent(id)}/seating`,
      manageEventQuantity: (id: string) =>
        `${VENDOR_DASHBOARD_PREFIX}/events/${encodeURIComponent(id)}/quantity`,
      attractions: `${VENDOR_DASHBOARD_PREFIX}/attractions`,
      addAttraction: `${VENDOR_DASHBOARD_PREFIX}/attractions/new`,
      editAttraction: (id: string) =>
        `${VENDOR_DASHBOARD_PREFIX}/attractions/new?id=${encodeURIComponent(id)}`,
      manageAttractionOccurrences: (id: string) =>
        `${VENDOR_DASHBOARD_PREFIX}/attractions/${encodeURIComponent(id)}/occurrences`,
      manageAttractionOccurrenceSeating: (attractionId, occurrenceId) =>
        `${VENDOR_DASHBOARD_PREFIX}/attractions/${encodeURIComponent(attractionId)}/occurrences/${encodeURIComponent(occurrenceId)}/seating`,
      tickets: `${VENDOR_DASHBOARD_PREFIX}/tickets`,
      attractionTickets: `${VENDOR_DASHBOARD_PREFIX}/attraction-tickets`,
      verifiers: `${VENDOR_DASHBOARD_PREFIX}/verifiers`,
      analytics: `${VENDOR_DASHBOARD_PREFIX}/analytics`,
      venues: `${VENDOR_DASHBOARD_PREFIX}/venues`,
      myVenues: `${VENDOR_DASHBOARD_PREFIX}/venues`,
      addVenue: `${VENDOR_DASHBOARD_PREFIX}/venues/new`,
      editVenue: (id: string) =>
        `${VENDOR_DASHBOARD_PREFIX}/venues/new?id=${encodeURIComponent(id)}`,
      manageVenueSchedule: (id: string) =>
        `${VENDOR_DASHBOARD_PREFIX}/venues/${encodeURIComponent(id)}/schedule`,
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
    manageEventSeating: (id: string) =>
      `${ADMIN_DASHBOARD_PREFIX}/manageEvents/${encodeURIComponent(id)}/seating`,
    manageEventQuantity: (id: string) =>
      `${ADMIN_DASHBOARD_PREFIX}/manageEvents/${encodeURIComponent(id)}/quantity`,
    attractions: `${ADMIN_DASHBOARD_PREFIX}/manageAttractions`,
    addAttraction: `${ADMIN_DASHBOARD_PREFIX}/addAttractions`,
    editAttraction: (id: string) =>
      `${ADMIN_DASHBOARD_PREFIX}/addAttractions?id=${encodeURIComponent(id)}`,
    manageAttractionOccurrences: (id: string) =>
      `${ADMIN_DASHBOARD_PREFIX}/manageAttractions/${encodeURIComponent(id)}/occurrences`,
    manageAttractionOccurrenceSeating: (attractionId, occurrenceId) =>
      `${ADMIN_DASHBOARD_PREFIX}/manageAttractions/${encodeURIComponent(attractionId)}/occurrences/${encodeURIComponent(occurrenceId)}/seating`,
    tickets: `${ADMIN_DASHBOARD_PREFIX}/manageTickets`,
    attractionTickets: `${ADMIN_DASHBOARD_PREFIX}/manageAttractionTickets`,
    verifiers: `${ADMIN_DASHBOARD_PREFIX}/verifiers`,
    analytics: `${ADMIN_DASHBOARD_PREFIX}/analytics`,
    venues: `${ADMIN_DASHBOARD_PREFIX}/manageVenues`,
    myVenues: `${ADMIN_DASHBOARD_PREFIX}/myVenues`,
    addVenue: `${ADMIN_DASHBOARD_PREFIX}/venues/new`,
    editVenue: (id: string) =>
      `${ADMIN_DASHBOARD_PREFIX}/venues/new?id=${encodeURIComponent(id)}`,
    manageVenueSchedule: (id: string) =>
      `${ADMIN_DASHBOARD_PREFIX}/manageVenues/${encodeURIComponent(id)}/schedule`,
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
