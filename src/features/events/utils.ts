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

export function formatCountdownToEnd(endIso: string): string {
  const end = new Date(endIso).getTime();
  const now = Date.now();
  const diff = Math.max(0, end - now);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
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

export function formatTicketPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.length === 3 ? currency : "USD",
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toFixed(2)}`;
  }
}

export function categoryQueryValue(label: string): string | undefined {
  if (label === ALL_EVENTS_CATEGORY) return undefined;
  return label;
}

export function buildEventsPageHref(category: string): string {
  const value = categoryQueryValue(category);
  if (!value) return "/events";
  return `/events?category=${encodeURIComponent(value)}`;
}
