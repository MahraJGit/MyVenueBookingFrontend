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
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/manageTickets`) {
    return `${VENDOR_DASHBOARD_PREFIX}/tickets`;
  }
  if (pathname === `${ADMIN_DASHBOARD_PREFIX}/verifiers`) {
    return `${VENDOR_DASHBOARD_PREFIX}/verifiers`;
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
