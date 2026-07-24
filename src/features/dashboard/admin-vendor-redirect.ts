export const ADMIN_DASHBOARD_PREFIX = "/adminDashbaord";
export const VENDOR_DASHBOARD_PREFIX = "/vendorDashboard";

/** Map legacy admin dashboard URLs to vendor dashboard equivalents. */
export function getVendorRedirectForAdminPath(
  pathname: string,
  search = "",
): string | null {
  if (!pathname.startsWith(ADMIN_DASHBOARD_PREFIX)) return null;

  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/manageEvents`) {
    return `${VENDOR_DASHBOARD_PREFIX}/events`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/addEvents`) {
    return `${VENDOR_DASHBOARD_PREFIX}/events/new${search}`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/manageVenues`) {
    return `${VENDOR_DASHBOARD_PREFIX}/venues`;
  }
  const venueScheduleMatch = pathname.match(
    new RegExp(`^${ADMIN_DASHBOARD_PREFIX}/manageVenues/([^/]+)/schedule$`),
  );
  if (venueScheduleMatch) {
    return `${VENDOR_DASHBOARD_PREFIX}/venues/${venueScheduleMatch[1]}/schedule`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/manageAttractions`) {
    return `${VENDOR_DASHBOARD_PREFIX}/attractions`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/addAttractions`) {
    return `${VENDOR_DASHBOARD_PREFIX}/attractions/new${search}`;
  }
  const attractionSeatingMatch = pathname.match(
    new RegExp(`^${ADMIN_DASHBOARD_PREFIX}/manageAttractions/([^/]+)/seating$`),
  );
  if (attractionSeatingMatch) {
    return `${VENDOR_DASHBOARD_PREFIX}/attractions/new?id=${encodeURIComponent(attractionSeatingMatch[1])}`;
  }
  const attractionOccurrencesMatch = pathname.match(
    new RegExp(`^${ADMIN_DASHBOARD_PREFIX}/manageAttractions/([^/]+)/occurrences$`),
  );
  if (attractionOccurrencesMatch) {
    return `${VENDOR_DASHBOARD_PREFIX}/attractions/${attractionOccurrencesMatch[1]}/occurrences`;
  }
  const attractionOccurrenceSeatingMatch = pathname.match(
    new RegExp(
      `^${ADMIN_DASHBOARD_PREFIX}/manageAttractions/([^/]+)/occurrences/([^/]+)/seating$`,
    ),
  );
  if (attractionOccurrenceSeatingMatch) {
    return `${VENDOR_DASHBOARD_PREFIX}/attractions/${attractionOccurrenceSeatingMatch[1]}/occurrences/${attractionOccurrenceSeatingMatch[2]}/seating`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/manageTickets`) {
    return `${VENDOR_DASHBOARD_PREFIX}/tickets`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/manageAttractionTickets`) {
    return `${VENDOR_DASHBOARD_PREFIX}/attraction-tickets`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/verifiers`) {
    return `${VENDOR_DASHBOARD_PREFIX}/verifiers${search}`;
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
