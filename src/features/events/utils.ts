import type { PublicEvent, TicketTypeRow } from "@/features/events/api";

const FALLBACK_IMAGES = [
  "/images/card-img-2.jpg",
  "/images/card-img-3.jpg",
  "/images/card-img-4.png",
  "/images/card-img-5.jpg",
  "/images/card-img-6.jpg",
  "/images/card-img-7.jpg",
  "/images/card-img-8.jpg",
  "/images/card-img-9.png",
  "/images/card-img-10.jpg",
];

export const ALL_EVENTS_CATEGORY = "All";

export function getFallbackEventImage(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash + seed.charCodeAt(i)) % FALLBACK_IMAGES.length;
  }
  return FALLBACK_IMAGES[hash] ?? FALLBACK_IMAGES[0];
}

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getEventCountdownTargetIso(
  event: Pick<PublicEvent, "endDateTime" | "ticketTypes">,
  nowMs = Date.now(),
): string {
  const futureSalesEnds = (event.ticketTypes ?? [])
    .map((ticket) => ticket.salesEnd)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => new Date(value).getTime())
    .filter((ms) => !Number.isNaN(ms) && ms > nowMs);

  if (futureSalesEnds.length > 0) {
    return new Date(Math.min(...futureSalesEnds)).toISOString();
  }

  return event.endDateTime;
}

export function formatCountdownToEnd(endIso: string, nowMs = Date.now()): string {
  const end = new Date(endIso).getTime();
  if (Number.isNaN(end)) return "00:00:00";

  const diff = Math.max(0, end - nowMs);
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

function ticketPrice(t: TicketTypeRow): number {
  return typeof t.price === "number" ? t.price : Number(t.price);
}

export function getMinTicketPrice(event: PublicEvent): {
  price: number;
  currency: string;
} | null {
  const active = event.ticketTypes?.filter((t) => t.name);
  if (!active?.length) return null;
  const sorted = [...active].sort((a, b) => ticketPrice(a) - ticketPrice(b));
  const cheapest = sorted[0];
  return {
    price: ticketPrice(cheapest),
    currency: cheapest.currency || "PKR",
  };
}

import { formatMoney } from "@/features/currency/format";

export function formatTicketPrice(price: number, currency: string): string {
  return formatMoney(price, currency);
}

export function categoryQueryValue(label: string): string | undefined {
  if (label === ALL_EVENTS_CATEGORY) return undefined;
  return label;
}

export function buildEventsPageHref(
  category: string,
  extra?: { search?: string; city?: string },
): string {
  const sp = new URLSearchParams();
  const value = categoryQueryValue(category);
  if (value) sp.set("category", value);
  if (extra?.search?.trim()) sp.set("search", extra.search.trim());
  if (extra?.city?.trim()) sp.set("city", extra.city.trim());
  const qs = sp.toString();
  return qs ? `/events?${qs}` : "/events";
}
