import type { EntityStatus, PricingModel, PublicVenue, UnavailabilityReason } from "./types";
import { formatMoney } from "@/features/currency/format";
import { getPackagesFromConfig } from "@/features/venues/packages";

import type { VenuePriceLabels } from "@/features/i18n/use-venue-price-labels";

const FALLBACK_PRICE_LABELS: VenuePriceLabels = {
  perDay: "per day",
  perHour: "per hour",
  flatRate: "flat rate",
  from: "from",
  perUnit: "per unit",
  perBooking: "per booking",
  perGuestPackage: (name) => `per guest (${name})`,
  perGuestFromPackages: "per guest (from packages)",
};

const FALLBACK_IMAGES = [
  "/images/card-img-2.jpg",
  "/images/card-img-3.jpg",
  "/images/card-img-4.png",
  "/images/card-img-5.jpg",
];

export function getFallbackVenueImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % FALLBACK_IMAGES.length;
  }
  return FALLBACK_IMAGES[hash] ?? FALLBACK_IMAGES[0];
}

export function formatVenuePrice(price: number, currency: string): string {
  return formatMoney(price, currency);
}

export function getVenueAmenityPriceInfo(
  amenity: {
    pricingType: string;
    isIncluded?: boolean;
    pricingConfig?: Record<string, unknown> | null;
  },
  labels: VenuePriceLabels = FALLBACK_PRICE_LABELS,
): { amount: number; suffix: string } | null {
  if (amenity.pricingType === "INCLUDED" || amenity.isIncluded) {
    return null;
  }
  const config = amenity.pricingConfig ?? {};
  if (amenity.pricingType === "PER_UNIT" && config.unitPrice != null) {
    return { amount: Number(config.unitPrice), suffix: labels.perUnit };
  }
  if (amenity.pricingType === "PER_HOUR" && config.hourlyPrice != null) {
    return { amount: Number(config.hourlyPrice), suffix: labels.perHour };
  }
  if (amenity.pricingType === "FLAT_PER_EVENT" && config.flatPrice != null) {
    return { amount: Number(config.flatPrice), suffix: labels.perBooking };
  }
  if (amenity.pricingType === "PACKAGE_BASED") {
    const packages = getPackagesFromConfig(config);
    if (packages.length === 1) {
      return {
        amount: Number(packages[0].pricePerHead),
        suffix: labels.perGuestPackage(packages[0].name),
      };
    }
    if (packages.length > 1) {
      const min = Math.min(...packages.map((p) => Number(p.pricePerHead)));
      return { amount: min, suffix: labels.perGuestFromPackages };
    }
  }
  return null;
}

export function decimalToNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return typeof value === "number" ? value : Number(value);
}

export function getVenueDisplayPrice(
  venue: PublicVenue,
  labels: VenuePriceLabels = FALLBACK_PRICE_LABELS,
): {
  price: number;
  currency: string;
  label: string;
} | null {
  const pricing = venue.pricing;
  if (!pricing) return null;

  const currency = pricing.currency || "AED";
  const base = decimalToNumber(pricing.basePrice);
  const config = pricing.config as Record<string, unknown>;

  if (pricing.modelType === "DAILY_BLOCK" && config.pricePerDay !== undefined) {
    const daily = decimalToNumber(config.pricePerDay as number);
    return { price: daily, currency, label: labels.perDay };
  }

  if (pricing.modelType === "HOURLY") {
    return { price: base, currency, label: labels.perHour };
  }

  if (pricing.modelType === "FLAT_RATE") {
    return { price: base, currency, label: labels.flatRate };
  }

  return { price: base, currency, label: labels.from };
}

export function pricingModelLabel(model: PricingModel): string {
  const labels: Record<PricingModel, string> = {
    HOURLY: "Hourly",
    NAMED_SLOTS: "Named slots",
    DAILY_BLOCK: "Daily",
    FLAT_RATE: "Flat rate",
  };
  return labels[model] ?? model;
}

export function unavailabilityMessage(reason?: UnavailabilityReason): string {
  switch (reason) {
    case "BLOCKED":
      return "This date is blocked by the venue.";
    case "CLOSED":
      return "The venue is closed on this day.";
    case "FULLY_BOOKED":
      return "Fully booked — please try another date.";
    case "OUT_OF_WINDOW":
      return "This date is outside the booking window.";
    default:
      return "Not available on this date.";
  }
}

export function entityStatusLabel(status: EntityStatus | undefined): string {
  if (!status) return "Unknown";
  const labels: Partial<Record<EntityStatus, string>> = {
    DRAFT: "Draft",
    PENDING: "Pending review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    ACTIVE: "Active",
    INACTIVE: "Inactive",
    CANCELLED: "Cancelled",
    COMPLETED: "Completed",
  };
  return labels[status] ?? status.charAt(0) + status.slice(1).toLowerCase();
}

type VenueReadinessSource = {
  name?: string | null;
  address?: string | null;
  coverImage?: string | null;
  pricing?: unknown | null;
  schedules?: Array<{ isOpen: boolean }> | null;
  amenities?: unknown[] | null;
};

export function evaluateVenueReadiness(venue: VenueReadinessSource) {
  const schedules = venue.schedules ?? [];
  const amenities = venue.amenities ?? [];
  const checks = [
    {
      id: "details",
      label: "Venue details",
      required: true,
      met: Boolean(venue.name?.trim() && venue.address?.trim()),
      message: "Name and address are required",
    },
    {
      id: "pricing",
      label: "Pricing configured",
      required: true,
      met: Boolean(venue.pricing),
      message: "Save pricing before submitting for review",
    },
    {
      id: "schedule",
      label: "Weekly schedule",
      required: true,
      met: schedules.some((schedule) => schedule.isOpen),
      message: "At least one open day is required",
    },
    {
      id: "amenities",
      label: "Amenities & services",
      required: true,
      met: amenities.length > 0,
      message: "Add at least one amenity before submitting for review",
    },
    {
      id: "cover",
      label: "Cover image",
      required: false,
      met: Boolean(venue.coverImage),
      message: "Recommended for better visibility",
    },
  ];

  const requiredChecks = checks.filter((check) => check.required);
  const requiredComplete = requiredChecks.filter((check) => check.met).length;
  const requiredTotal = requiredChecks.length;
  const metCount = checks.filter((check) => check.met).length;

  return {
    ready: requiredComplete === requiredTotal,
    requiredComplete,
    requiredTotal,
    percentComplete: checks.length ? Math.round((metCount / checks.length) * 100) : 0,
    checks,
  };
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function defaultWeeklySchedules() {
  return DAY_NAMES.map((_, dayOfWeek) => ({
    dayOfWeek,
    openTime: "09:00",
    closeTime: "22:00",
    isOpen: dayOfWeek !== 0,
  }));
}

const PROPERTY_VENUE_PATTERN =
  /villa|apartment|house|chalet|cottage|studio|penthouse|loft|accommodation|rental|property|suite|flat|bungalow/i;

export function isPropertyStyleVenueType(name?: string | null, slug?: string | null): boolean {
  if (!name && !slug) return false;
  return PROPERTY_VENUE_PATTERN.test(name ?? "") || PROPERTY_VENUE_PATTERN.test(slug ?? "");
}

export type VenuePropertyAttributes = {
  floorArea?: number;
  bedrooms?: number;
  bathrooms?: number;
};

export function parseVenuePropertyAttributes(
  customAttributes?: Record<string, unknown> | null,
): VenuePropertyAttributes {
  if (!customAttributes) return {};
  const num = (key: string) => {
    const v = customAttributes[key];
    if (v === undefined || v === null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    floorArea: num("floorArea"),
    bedrooms: num("bedrooms"),
    bathrooms: num("bathrooms"),
  };
}

export function buildVenueCustomAttributes(
  attrs: VenuePropertyAttributes,
  existing?: Record<string, unknown> | null,
): Record<string, unknown> {
  const next = { ...(existing ?? {}) };
  for (const key of ["floorArea", "bedrooms", "bathrooms"] as const) {
    const value = attrs[key];
    if (value !== undefined && value !== null && !Number.isNaN(value)) {
      next[key] = value;
    } else {
      delete next[key];
    }
  }
  return next;
}
