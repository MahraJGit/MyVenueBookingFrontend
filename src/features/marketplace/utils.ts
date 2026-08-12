import { decimalToNumber } from "@/features/venues/utils";
import type {
  MarketplaceService,
  ServiceCustomizationMode,
  ServicePackage,
  ServicePricingModel,
} from "./types";

export { decimalToNumber };

export function defaultWeeklyServiceSchedules() {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    openTime: "09:00",
    closeTime: "18:00",
    isOpen: dayOfWeek >= 1 && dayOfWeek <= 5,
  }));
}

export function servicePricingModelLabel(model: ServicePricingModel): string {
  switch (model) {
    case "FLAT_PER_EVENT":
      return "Per event";
    case "HOURLY":
      return "Hourly";
    case "PER_GUEST":
      return "Per guest";
    default:
      return model;
  }
}

export function serviceCustomizationLabel(mode: ServiceCustomizationMode): string {
  switch (mode) {
    case "NONE":
      return "None";
    case "PACKAGE":
      return "Packages";
    case "MENU_BUILDER":
      return "Menu builder";
    default:
      return mode;
  }
}

export function getServiceFromPrice(service: MarketplaceService): {
  amount: number | null;
  currency: string;
} {
  const currency = service.currency || "AED";
  const base = decimalToNumber(service.basePrice);
  if (base > 0) return { amount: base, currency };

  const packages = (service.packages ?? []).filter((p) => p.isActive !== false);
  if (packages.length === 0) return { amount: null, currency };

  let min = Infinity;
  for (const pkg of packages) {
    const price = decimalToNumber(pkg.price);
    if (price < min) min = price;
  }
  return { amount: Number.isFinite(min) ? min : null, currency };
}

export function packagePriceNumber(pkg: ServicePackage): number {
  return decimalToNumber(pkg.price);
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns an error message when guestCount violates optional service bounds. Empty input is ok. */
export function guestBoundsError(
  guestCountRaw: string | number | null | undefined,
  guestMin?: number | null,
  guestMax?: number | null,
  messages?: {
    invalid?: string;
    min?: string;
    max?: string;
  },
): string | null {
  if (guestCountRaw === "" || guestCountRaw == null) return null;
  const n =
    typeof guestCountRaw === "number" ? guestCountRaw : Number(guestCountRaw);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) {
    return messages?.invalid ?? "Enter a valid guest count";
  }
  if (guestMin != null && n < guestMin) {
    return messages?.min ?? `At least ${guestMin} guests required`;
  }
  if (guestMax != null && n > guestMax) {
    return messages?.max ?? `At most ${guestMax} guests allowed`;
  }
  return null;
}

export function hasGuestBounds(
  guestMin?: number | null,
  guestMax?: number | null,
): boolean {
  return guestMin != null || guestMax != null;
}


/** Local date key for a slot timestamp (YYYY-MM-DD). */
export function slotDateKey(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10);
  return formatDateKey(d);
}

export function formatSlotTimeRange(
  startAt: string | Date,
  endAt: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const start = typeof startAt === "string" ? new Date(startAt) : startAt;
  const end = typeof endAt === "string" ? new Date(endAt) : endAt;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${String(startAt)} – ${String(endAt)}`;
  }
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    ...options,
  };
  return `${start.toLocaleTimeString(undefined, timeOpts)} – ${end.toLocaleTimeString(undefined, timeOpts)}`;
}

export function formatSlotLabel(
  startAt: string | Date,
  endAt: string | Date,
  label?: string | null,
): string {
  const range = formatSlotTimeRange(startAt, endAt);
  const name = label?.trim();
  return name ? `${name} · ${range}` : range;
}

export function monthRangeKeys(year: number, month: number): {
  startDate: string;
  endDate: string;
} {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { startDate: formatDateKey(start), endDate: formatDateKey(end) };
}

export function parseCitiesInput(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
