import type { EntityStatus, PricingModel, PublicVenue } from "./types";

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
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.length === 3 ? currency : "AED",
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

export function decimalToNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  return typeof value === "number" ? value : Number(value);
}

export function getVenueDisplayPrice(venue: PublicVenue): {
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
    return { price: daily, currency, label: "per day" };
  }

  if (pricing.modelType === "HOURLY") {
    return { price: base, currency, label: "per hour" };
  }

  if (pricing.modelType === "FLAT_RATE") {
    return { price: base, currency, label: "flat rate" };
  }

  return { price: base, currency, label: "from" };
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

export function entityStatusLabel(status: EntityStatus | undefined): string {
  if (!status) return "Unknown";
  return status.charAt(0) + status.slice(1).toLowerCase();
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
