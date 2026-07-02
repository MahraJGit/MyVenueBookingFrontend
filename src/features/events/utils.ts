import type { PublicEvent, SalePhase, TicketTypeRow } from "@/features/events/api";

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

export function formatEventDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function computeTicketSalePhase(
  ticket: TicketTypeRow,
  now: Date = new Date(),
  eventEnd?: string,
): SalePhase {
  if (ticket.salePhase) return ticket.salePhase;

  const available = ticket.quantityTotal - (ticket.quantitySold ?? 0);
  if (available <= 0) return "sold_out";

  const salesStart = toDate(ticket.salesStart);
  const salesEnd = toDate(ticket.salesEnd) ?? toDate(eventEnd);

  if (salesStart && now < salesStart) return "not_started";
  if (salesEnd && now > salesEnd) return "ended";
  return "open";
}

export function computeEventSalePhase(
  event: Pick<PublicEvent, "endDateTime" | "ticketTypes" | "salePhase">,
  now: Date = new Date(),
): SalePhase {
  if (event.salePhase) return event.salePhase;

  const eventEnd = toDate(event.endDateTime);
  if (eventEnd && now > eventEnd) return "ended";

  const tickets = event.ticketTypes ?? [];
  if (tickets.length === 0) return "ended";

  const phases = tickets.map((ticket) =>
    computeTicketSalePhase(ticket, now, event.endDateTime),
  );
  if (phases.includes("open")) return "open";
  if (phases.includes("not_started")) return "not_started";
  if (phases.every((phase) => phase === "sold_out")) return "sold_out";
  return "ended";
}

export function isTicketPurchasable(
  ticket: TicketTypeRow,
  eventEnd?: string,
  now: Date = new Date(),
): boolean {
  return computeTicketSalePhase(ticket, now, eventEnd) === "open";
}

export function getEventCountdownTargetIso(
  event: Pick<PublicEvent, "endDateTime" | "ticketTypes">,
  nowMs = Date.now(),
): string {
  const now = new Date(nowMs);
  const openTickets = (event.ticketTypes ?? []).filter(
    (ticket) => computeTicketSalePhase(ticket, now, event.endDateTime) === "open",
  );

  const futureSalesEnds = openTickets
    .map((ticket) => ticket.salesEnd)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => new Date(value).getTime())
    .filter((ms) => !Number.isNaN(ms) && ms > nowMs);

  if (futureSalesEnds.length > 0) {
    return new Date(Math.min(...futureSalesEnds)).toISOString();
  }

  const upcomingSalesStarts = (event.ticketTypes ?? [])
    .map((ticket) => ticket.salesStart)
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .map((value) => new Date(value).getTime())
    .filter((ms) => !Number.isNaN(ms) && ms > nowMs);

  if (upcomingSalesStarts.length > 0) {
    return new Date(Math.min(...upcomingSalesStarts)).toISOString();
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

export function getMinTicketPrice(
  event: PublicEvent,
): {
  price: number;
  currency: string;
} | null {
  const openTickets = (event.ticketTypes ?? []).filter((ticket) =>
    isTicketPurchasable(ticket, event.endDateTime),
  );
  if (!openTickets.length) return null;

  const sorted = [...openTickets].sort((a, b) => ticketPrice(a) - ticketPrice(b));
  const cheapest = sorted[0];
  return {
    price: ticketPrice(cheapest),
    currency: cheapest.currency || "PKR",
  };
}

export function getPurchasableTicketTypes(event: PublicEvent): TicketTypeRow[] {
  return (event.ticketTypes ?? []).filter(
    (ticket) =>
      ticket.id &&
      isTicketPurchasable(ticket, event.endDateTime) &&
      ticket.quantityTotal - (ticket.quantitySold ?? 0) > 0,
  );
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

export function getSalePhaseMessageKey(phase: SalePhase): string {
  switch (phase) {
    case "open":
      return "saleOpen";
    case "not_started":
      return "saleNotStarted";
    case "sold_out":
      return "soldOut";
    default:
      return "saleEnded";
  }
}

export function getEarliestSalesStart(
  event: Pick<PublicEvent, "ticketTypes">,
): string | null {
  const starts = (event.ticketTypes ?? [])
    .map((ticket) => ticket.salesStart)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime())
    .filter((ms) => !Number.isNaN(ms));

  if (starts.length === 0) return null;
  return new Date(Math.min(...starts)).toISOString();
}
