import type { VendorServiceEnrollment, VendorServiceType } from "@/features/vendor/api";

export const VENDOR_SERVICE_OPTIONS: {
  id: "events" | "attractions" | "marketplace" | "venues";
  apiType: VendorServiceType;
  titleKey:
    | "serviceEventsTitle"
    | "serviceAttractionsTitle"
    | "serviceMarketplaceTitle"
    | "serviceVenuesTitle";
  descKey:
    | "serviceEventsDesc"
    | "serviceAttractionsDesc"
    | "serviceMarketplaceDesc"
    | "serviceVenuesDesc";
}[] = [
  {
    id: "events",
    apiType: "EVENTS",
    titleKey: "serviceEventsTitle",
    descKey: "serviceEventsDesc",
  },
  {
    id: "attractions",
    apiType: "ATTRACTIONS",
    titleKey: "serviceAttractionsTitle",
    descKey: "serviceAttractionsDesc",
  },
  {
    id: "marketplace",
    apiType: "MARKETPLACE",
    titleKey: "serviceMarketplaceTitle",
    descKey: "serviceMarketplaceDesc",
  },
  {
    id: "venues",
    apiType: "VENUES",
    titleKey: "serviceVenuesTitle",
    descKey: "serviceVenuesDesc",
  },
];

/** Services that can still be requested (not already APPROVED or PENDING). */
export function getRequestableVendorServices(
  enrollments: VendorServiceEnrollment[] | undefined,
) {
  const locked = new Set(
    (enrollments ?? [])
      .filter((s) => s.status === "APPROVED" || s.status === "PENDING")
      .map((s) => s.serviceType),
  );
  return VENDOR_SERVICE_OPTIONS.filter((s) => !locked.has(s.apiType));
}

export function hasApprovedVendorService(
  enabledServices: VendorServiceType[] | undefined,
  serviceType: VendorServiceType,
) {
  return (enabledServices ?? []).includes(serviceType);
}
